const express = require("express")
const knex = require("knex")
const http_errors = require("http-errors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

const PORT = 8001
const HOSTNAME = "localhost"
const SECRET_KEY = "minha-chave-secreta"

const api = express()

api.use(express.json())
api.use(express.urlencoded({ extended: true }))

const conn = knex({
    client: "mysql",
    connection: {
        host: HOSTNAME,
        user: "root",
        password: "",
        database: "bd_dsapi"
    }
}) 

// Middleware de autenticação:
const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    
    if (!token) {
        return next(http_errors(401, "Não autenticado."))
    }
    
    // Validação e decodificação do JWT:
    try {
        const usuario = jwt.verify(token, SECRET_KEY)
        req.usuario = usuario
        next()
    } catch (err) {
        return next(http_errors(401, "Token inválido ou expirado."))
    }
}

// Middleware de verificação de permissões:
const verificarAdmin = (req, res, next) => {
    if (req.usuario.papel !== "admin") {
        return next(http_errors(403, "Acesso negado!"))
    }
    next()
}

// Rota inicial de boas-vindas:
api.get("/", (req, res) => {
    res.json({ resposta: 'Olá, caro(a) cliente, aproveite as nossas promoções de hoje!!!' })
})

// Rota de login do usuário:
api.post("/login", async (req, res, next) => {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            throw http_errors(400, "Email e senha são obrigatórios.")
        }

        const usuario = await conn("clientes").where("email", email).first()

        if (!usuario) {
            throw http_errors(401, "Email ou senha incorretos.")
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha)

        if (!senhaValida) {
            throw http_errors(401, "Email ou senha incorretos.")
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                papel: usuario.papel
            },
            SECRET_KEY,
            { expiresIn: "24h" } 
        )

        res.status(200).json({
            resposta: "Login realizado com sucesso.",
            token: token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                papel: usuario.papel
            }
        })
    } catch (err) {
        next(err)
    }
})

// Rota para registrar cliente com senha segura:
api.post("/client", async (req, res, next) => {
    try {
        const { nome, altura, nascimento, cidade_id, email, senha } = req.body

        if (!nome || !altura || !nascimento || !cidade_id) {
            throw http_errors(400, "Nome, altura, nascimento e cidade_id são obrigatórios.")
        }

        if ((email && !senha) || (!email && senha)) {
            throw http_errors(400, "Se cadastrar email, deve fornecer senha também.")
        }

        let senhaHasheada = null
        if (email && senha) {
            senhaHasheada = await bcrypt.hash(senha, 10)
        }

        const [id] = await conn("clientes").insert({
            nome, 
            altura, 
            nascimento, 
            cidade_id,
            email: email || null, 
            senha: senhaHasheada,
            papel: "cliente"
        })

        res.status(201).json({
            resposta: "Cliente cadastrado com sucesso.",
            id: id
        })
    } catch (err) {
        next(err)
    }
})

// Obter lista de produtos ativos:
api.get("/product", verificarToken, async (req, res, next) => {
    try {
        const dados = await conn("produtos")
            .leftJoin("categorias", "produtos.categoria_id", "=", "categorias.id")
            .select("produtos.*", "categorias.nome AS cat")
            
        res.json(dados)
    } catch (err) {
        next(err)
    }
})

// Obter detalhes de um produto pelo ID:
api.get("/product/:idProd", verificarToken, async (req, res, next) => {
    try {
        const dados = await conn("produtos")
            .leftJoin("categorias", "produtos.categoria_id", "=", "categorias.id")
            .select("produtos.*", "categorias.nome AS cat")
            .where("produtos.id", req.params.idProd)
            .first()
            
        if (!dados) throw http_errors(404, "Produto não encontrado.")
        res.json(dados)
    } catch (err) {
        next(err)
    }
})

// Cadastrar novo pedido:
api.post("/order", verificarToken, async (req, res, next) => {
    try {
        const { cliente_id, horario, endereco } = req.body

        const [id] = await conn("pedidos").insert({
            cliente_id,
            horario,
            endereco
        })

        res.status(201).json({
            resposta: "Pedido realizado.",
            id: id
        })
    } catch (err) {
        next(http_errors(400, "Erro ao realizar pedido: " + err.message))
    }
})

// Listar todos os pedidos:
api.get("/order", verificarToken, async (req, res, next) => {
    try {
        const dados = await conn("pedidos")
            .leftJoin("clientes", "pedidos.cliente_id", "=", "clientes.id")
            .select("pedidos.*", "clientes.nome AS cli")
            
        res.json(dados)
    } catch (err) {
        next(err)
    }
})

// Criar produto (Requer Admin):
api.post("/product", verificarToken, verificarAdmin, async (req, res, next) => {
    try {
        const [id] = await conn("produtos").insert(req.body)
        
        res.status(201).json({
            resposta: "Produto inserido.",
            id: id
        })
    } catch (err) {
        next(http_errors(400, "Erro ao inserir produto: " + err.message))
    }
})

// Modificar produto (Requer Admin):
api.put("/admin/product/:idProd", verificarToken, verificarAdmin, async (req, res, next) => {
    try {
        const atualizado = await conn("produtos")
            .where("id", req.params.idProd)
            .update(req.body)

        if (!atualizado) {
            throw http_errors(404, "Erro ao atualizar: Produto não encontrado!")
        }

        res.status(200).json({ resposta: "Produto atualizado." })
    } catch (err) {
        next(err)
    }
})

// Deletar produto (Requer Admin):
api.delete("/admin/product/:idProd", verificarToken, verificarAdmin, async (req, res, next) => {
    try {
        const deletado = await conn("produtos")
            .where("id", req.params.idProd)
            .delete()

        if (!deletado) {
            throw http_errors(404, "Erro ao excluir: Produto não encontrado!")
        }

        res.status(200).json({ resposta: "Produto excluído." })
    } catch (err) {
        next(err)
    }
})

// Modificar pedido (Requer Admin):
api.put("/admin/order/:idOrd", verificarToken, verificarAdmin, async (req, res, next) => {
    try {
        const { cliente_id, horario, endereco } = req.body

        const atualizado = await conn("pedidos")
            .where("id", req.params.idOrd)
            .update({ cliente_id, horario, endereco })

        if (!atualizado) {
            throw http_errors(404, "Erro ao atualizar: Pedido não encontrado!")
        }

        res.status(200).json({ resposta: "Pedido atualizado." })
    } catch (err) {
        next(err)
    }
})

// Deletar pedido (Requer Admin):
api.delete("/admin/order/:idOrd", verificarToken, verificarAdmin, async (req, res, next) => {
    try {
        const deletado = await conn("pedidos")
            .where("id", req.params.idOrd)
            .delete()

        if (!deletado) {
            throw http_errors(404, "Erro ao excluir: Pedido não encontrado!")
        }

        res.status(200).json({ resposta: "Pedido excluído." })
    } catch (err) {
        next(err)
    }
})

// Middleware Global de Tratamento de Erros (NOVO - Necessário para o http-errors funcionar):
api.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        erro: err.message || "Erro interno do servidor."
    })
})

api.listen(PORT, () => {
    console.log(`Servidor rodando em: http://${HOSTNAME}:${PORT}`)
})
