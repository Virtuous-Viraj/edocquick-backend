const jwt = require("jsonwebtoken")


module.exports = async(req, res, next) =>{
    try {
        // console.log(req)
        if(!req.headers['authorization'])
        {
            console.log("missing token")
        }
        const token = req.headers["authorization"].split(" ")[1];
        // console.log(token)
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
            if(err)
            {
                return res.status(401).send({message : "Invalid Token", success : false})
            }
            else{
                req.body.userId = decoded.id
                next()
            }
            
        })
    } catch (error) {
        console.log(error)
        return res.status(401).send({message : "Auth falied", success : false})
    }
}

