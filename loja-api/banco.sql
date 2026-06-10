CREATE DATABASE IF NOT EXISTS bd_dsapi;
USE bd_dsapi;

-- TABELA: categorias
CREATE TABLE categorias (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL
);

INSERT INTO categorias (nome) VALUES 
('Periféricos'),
('Roupas'),
('Livros Didáticos');

-- TABELA: cidades
CREATE TABLE cidades (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL
);

INSERT INTO cidades (nome) VALUES 
('Campinas'),
('Curitiba'),
('Recife');

-- TABELA: produtos
CREATE TABLE produtos (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    preco DOUBLE,
    quantidade DOUBLE,
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

INSERT INTO produtos (nome, preco, quantidade, categoria_id) VALUES 
('Mouse sem fio', 85.50, 20.0, 1),       
('Teclado Mecânico', 350.00, 10.0, 1),          
('Moletom Preto', 149.90, 15.0, 2),        
('Livro de JavaScript', 75.00, 30.0, 3);      

-- TABELA: clientes
CREATE TABLE clientes (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    altura DOUBLE,
    nascimento DATE,
    cidade_id INT,
    email VARCHAR(100) UNIQUE DEFAULT NULL,
    senha VARCHAR(255) DEFAULT NULL,
    papel ENUM('cliente', 'admin') DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cidade_id) REFERENCES cidades(id)
);

INSERT INTO clientes (nome, altura, nascimento, cidade_id, email, senha, papel) VALUES 
('Lucas Moraes', 1.76, '1998-05-20', 1, 'lucas.moraes@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36LrvWFm', 'cliente'),
('Mariana Rabelo', 1.62, '2000-10-15', 2, 'mariana.rabelo@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36LrvWFm', 'cliente'),
('Tiago Fonseca', 1.80, '1992-03-08', 3, 'tiago.fonseca@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36LrvWFm', 'cliente'),
('Juliana Tavares', 1.68, '1995-12-01', 1, 'juliana.tavares@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36LrvWFm', 'cliente'),
('Chefe Admin', 1.70, '1980-07-22', 2, 'gerencia@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36LrvWFm', 'admin');

-- TABELA: pedidos
CREATE TABLE pedidos (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    horario DATETIME,
    endereco VARCHAR(200),
    cliente_id INT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

INSERT INTO pedidos (horario, endereco, cliente_id) VALUES 
('2026-06-10 14:20:00', 'Rua das Flores, 123 - Centro', 1), 
('2026-06-11 09:45:00', 'Av. Sete de Setembro, 456', 2),            
('2026-06-12 16:30:00', 'Praça da Matriz, S/N', 3); 

-- TABELA: pedidos_produtos
CREATE TABLE pedidos_produtos (
    pedido_id INT,
    produto_id INT,
    preco DOUBLE,
    quantidade DOUBLE,
    PRIMARY KEY (pedido_id, produto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

INSERT INTO pedidos_produtos (pedido_id, produto_id, preco, quantidade) VALUES
(1, 1, 85.50, 1.0), 
(1, 2, 350.00, 1.0),   
(2, 3, 149.90, 2.0),   
(3, 4, 75.00, 3.0);
