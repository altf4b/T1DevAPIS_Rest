const bcrypt = require("bcryptjs")

const senha = "senha123"

bcrypt.hash(senha, 10, (err, hash) => {
    if (err) {
        console.error("Erro:", err)
        return
    }
    console.log("Hash da senha 'senha123':")
    console.log(hash)
})
