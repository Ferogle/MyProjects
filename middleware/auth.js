const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = async function (req, res, next) {
  const token = await req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token,auth denied' });
  }

  try {
    const decoded = await jwt.verify(token, config.get('jwtToken'));
    req.user = decoded.user;

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
