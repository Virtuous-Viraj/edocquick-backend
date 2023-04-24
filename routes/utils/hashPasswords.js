const bcrypt = require("bcryptjs")
const salt = bcrypt.genSaltSync(10)

const hashPasswords = (password) =>{
    return bcrypt.hashSync(password, salt)
}

module.exports = {hashPasswords}