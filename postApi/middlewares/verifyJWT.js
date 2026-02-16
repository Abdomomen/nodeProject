const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const verifyJWT = (req, res, next) => {
    let token = req.headers["authorization"] || req.headers["Authorization"];
    if (!token) {
        const error = new Error("No token provided");
        error.statusCode = 401;
        return next(error);
    }

    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            const error = new Error("Invalid token");
            error.statusCode = 401;
            return next(error);
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyJWT;