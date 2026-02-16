const jwt = require('jsonwebtoken');
const generateToken = ({email,id,role}) => {
    return jwt.sign({email,id,role}, process.env.JWT_SECRET, {expiresIn: '1d'});
}

module.exports = generateToken