import pactum from "pactum";
import { StatusCodes } from "http-status-codes";
import { SimpleReporter } from "../simple-reporter";
import { faker } from "@faker-js/faker";

describe("DummyJSON API - Testes de Integração e Contrato", () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = "https://dummyjson.com";
  let createdProductId = "";

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe("Cenários de Cadastro e Escrita (POST e PUT)", () => {
    it("Cenário 1: Deve cadastrar um novo produto com sucesso utilizando dados dinâmicos", async () => {
      const productName = faker.commerce.productName();
      const productPrice = Number(faker.commerce.price({ min: 10, max: 1000 }));

      createdProductId = await p
        .spec()
        .post(`${baseUrl}/products/add`)
        .withJson({
          title: productName,
          description: faker.commerce.productDescription(),
          price: productPrice,
          category: "smartphones",
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonSchema({
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            price: { type: "number" },
            category: { type: "string" },
          },
          required: ["id", "title", "price"],
        })
        .returns("id");
    });

    it("Cenário 2: Deve atualizar as informações de um produto existente via PUT", async () => {
      const updatedTitle = "Smartphone Teste Atualizado QA";

      await p
        .spec()
        .put(`${baseUrl}/products/${createdProductId || 1}`)
        .withJson({
          title: updatedTitle,
          price: 999.99,
        })
        .expectStatus(StatusCodes.OK)
        .expectBodyContains(updatedTitle);
    });
  });

  describe("Cenários de Consulta e Processamento (GET e Carrinhos)", () => {
    it("Cenário 3: Deve buscar os detalhes de um produto específico com sucesso", async () => {
      await p
        .spec()
        .get(`${baseUrl}/products/${createdProductId || 1}`)
        .expectStatus(StatusCodes.OK)
        .expectHeaderContains("content-type", "application/json")
        .expectJsonSchema({
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
          },
          required: ["id", "title"],
        });
    });

    it("Cenário 4: Deve processar a criação de um novo carrinho de compras com múltiplos itens", async () => {
      await p
        .spec()
        .post(`${baseUrl}/carts/add`)
        .withJson({
          userId: 1,
          products: [
            {
              id: 1,
              quantity: 2,
            },
            {
              id: 15,
              quantity: 1,
            },
          ],
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonSchema({
          type: "object",
          properties: {
            id: { type: "integer" },
            total: { type: "number" },
            discountedTotal: { type: "number" },
            userId: { type: "integer" },
            totalProducts: { type: "integer" },
          },
          required: ["id", "total", "userId", "products"],
        });
    });

    it("Cenário 5: Deve validar o comportamento ao buscar um produto inexistente (Tratamento de Erro)", async () => {
      await p
        .spec()
        .get(`${baseUrl}/products/999999`)
        .expectStatus(StatusCodes.NOT_FOUND)
        .expectBodyContains("Product with id '999999' not found");
    });
  });
});
