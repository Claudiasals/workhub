import Joi from "joi"; 
import { handleRouteErrors } from "../../../utils/error.js"; 
import { formatResponse } from "../../../utils/format.js";
import {
	comparePassword, 
	generateAccessToken, 
	hashPassword, 
	generateTempPassword, 
} from "../../../utils/auth.js";
import { User } from "../../../db/index.js";
import { generate2FASecret, verify2FAToken } from "../services/twofa.js"; 

/**
 * LOGIN employee
 * POST /api/v1/auth/login
 * body: { username, password, token? }
 * Authenticates a user, checks credentials, and handles 2FA if enabled.
 */
export const login = async (req, res) => {
	const schema = Joi.object({
		username: Joi.string().required(), 
		password: Joi.string().required(), 
		code: Joi.string().allow("", null).optional(),
	});

	try {
		const { value, error } = schema.validate(req.body); 
		if (error) {
			return res
				.status(400)
				.json(formatResponse(null, false, error.details[0].message));
		}

		const { username, password, code } = value;

		const userDoc = await User.findOne({ username }).select("+password"); 
		if (!userDoc) {
			return res
				.status(401)
				.json(formatResponse(null, false, "Invalid credentials"));
		}

		if (userDoc.isActive === false) {
			return res
				.status(403)
				.json(formatResponse(null, false, "User is disabled"));
		}

		const isValid = await comparePassword(password, userDoc.password); 
		if (!isValid) {
			return res
				.status(401)
				.json(formatResponse(null, false, "Invalid credentials"));
		}

		// If 2FA is enabled, require code
		if (userDoc.twofaEnabled) {
			// 2FA enabled
			if (!code) {
				return res
					.status(200)
					.json(
						formatResponse({ is2FARequired: true }, true, "2FA code required")
					);
			}

			const result = verify2FAToken(userDoc.twofaSecret, code); // Verify 2FA code
			if (!result || Math.abs(result.delta) > 1) {
				return res
					.status(401)
					.json(formatResponse(null, false, "Invalid 2FA code"));
			}
		}

		await userDoc.populate({
			path: "workplace",
			select: "name location",
		}); 

		const user = userDoc.toObject();
		delete user.password; 

		const jwtToken = generateAccessToken({
			_id: userDoc._id.toString(),
			role: user.role,
			twofaVerified: userDoc.twofaEnabled ? true : false,
		}); 

		return res.status(200).json(
			formatResponse(
				{
					token: jwtToken,
					user,
				},
				true,
				"Login successful"
			)
		);
	} catch (error) {
		return handleRouteErrors(res, { error }); 
	}
};

/**
 * REGISTER new user (ADMIN only)
 * POST /api/v1/auth/register
 * Registers a new user, only accessible by admin.
 */
export const register = async (req, res) => {
	const schema = Joi.object({
		email: Joi.string().email().required(),
		username: Joi.string().min(3).required(), 
		firstName: Joi.string().required(), 
		lastName: Joi.string().required(), 
		role: Joi.string().valid("admin", "user").default("user"), 
		department: Joi.string().optional(), 
		password: Joi.string().min(6).optional(), 
		isGeneratedPassword: Joi.boolean().optional(), 
		personnelNumber: Joi.number().required(), 
		phone: Joi.number().optional(), 
		workplace: Joi.string().required(), 
		contractType: Joi.string()
			.valid("indeterminato", "determinato", "part-time")
			.optional(), 
		hireDate: Joi.date().optional(), 
	});

	try {
		const { value, error } = schema.validate(req.body);
		if (error) {
			return res
				.status(400)
				.json(formatResponse(null, false, error.details[0].message));
		}

		const {
			email,
			username,
			firstName,
			lastName,
			role,
			department,
			password,
			personnelNumber,
			phone,
			workplace,
			contractType,
			hireDate,
		} = value;

		const existing = await User.findOne({
			$or: [{ email }, { username }, { personnelNumber }],
		}); 

		if (existing) {
			return res
				.status(409)
				.json(
					formatResponse(
						null,
						false,
						"Email, Username o Matricola già esistenti"
					)
				);
		}

		if (!workplace.match(/^[0-9a-fA-F]{24}$/)) {
			return res
				.status(400)
				.json(
					formatResponse(
						null,
						false,
						"workplace non valido (ObjectId non valido)"
					)
				);
		}

		const plainPassword = password || generateTempPassword(10);
		const hashedPassword = await hashPassword(plainPassword); 

		const newUserDoc = await User.create({
			email,
			username,
			password: hashedPassword,
			isGeneratedPassword: password ? false : true,
			firstName,
			lastName,
			role,
			department,
			personnelNumber,
			phone,
			workplace,
			contractType,
			hireDate,
		}); 

		const newUser = newUserDoc.toObject();
		delete newUser.password; 

		return res.status(201).json(
			formatResponse(
				{
					user: newUser,
					tempPassword: password ? null : plainPassword,
				},
				true,
				"User created successfully"
			)
		);
	} catch (error) {
		return handleRouteErrors(res, { error }); 
	}
};

/**
 * RECOVER PASSWORD
 * POST /api/v1/auth/recover
 * Generates a temporary password for the user and updates their account.
 */
export const recoverPassword = async (req, res) => {
	const schema = Joi.object({
		email: Joi.string().email().allow(null, ""), 
		username: Joi.string().allow(null, ""), 
	});

	try {
		const { value, error } = schema.validate(req.body); 
		if (error) {
			return res
				.status(400)
				.json(formatResponse(null, false, error.details[0].message));
		}

		const { email, username } = value;
		if (!email && !username) {
			return res
				.status(400)
				.json(formatResponse(null, false, "Provide email or username"));
		}

		const userDoc = await User.findOne({ $or: [{ email }, { username }] }); 
		if (!userDoc) {
			return res
				.status(404)
				.json(formatResponse(null, false, "User not found"));
		}

		const tempPassword = generateTempPassword(10); 
		const hashedPassword = await hashPassword(tempPassword); 

		userDoc.password = hashedPassword;
		userDoc.isGeneratedPassword = true;
		await userDoc.save();

		return res.status(200).json(
			formatResponse(
				{
					email: userDoc.email,
					tempPassword,
				},
				true,
				"Temporary password generated"
			)
		);
	} catch (error) {
		return handleRouteErrors(res, { error }); 
	}
};

/**
 * ENABLE 2FA
 * PATCH /api/v1/auth/enable-2fa
 * Enables two-factor authentication for the user and returns QR code info.
 */
export const enable2FA = async (req, res) => {
	const schema = Joi.object({
		code: Joi.string().optional(), // Optional code
	});

	try {
		const { value, error } = schema.validate(req.body || {}); 
		if (error) {
			return res
				.status(400)
				.json(formatResponse(null, false, error.details[0].message));
		}

		const { code } = value;

		const user = await User.findById(req.user._id); 
		if (!user) {
			return res
				.status(404)
				.json(formatResponse(null, false, "User not found"));
		}

		// Generate QR code and secret for 2FA
		const secret = await generate2FASecret(user.username);

		user.twofaSecret = secret.secret;
		user.twofaEnabled = true;
		await user.save(); 

		return res
			.status(200)
			.json(
				formatResponse(
					{ qr: secret.qr, uri: secret.uri },
					true,
					"Scan QR and insert code"
				)
			);
	} catch (error) {
		return handleRouteErrors(res, { error }); 
	}
};

/**
 * DISABLE 2FA
 * PATCH /api/v1/auth/disable-2fa
 * Disables two-factor authentication for the user.
 */
export const disable2FA = async (req, res) => {
	try {
		const user = await User.findById(req.user._id); 
		if (!user) {
			return res
				.status(404)
				.json(formatResponse(null, false, "User not found"));
		}

		user.twofaSecret = null;
		user.twofaEnabled = false;
		await user.save(); 

		return res
			.status(200)
			.json(formatResponse(null, true, "2FA disabled successfully"));
	} catch (error) {
		return handleRouteErrors(res, { error });
	}
};
