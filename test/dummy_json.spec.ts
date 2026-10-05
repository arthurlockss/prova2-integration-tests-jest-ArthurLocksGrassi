import pactum from "pactum";
import { StatusCodes } from "http-status-codes";
import { SimpleReporter } from "../simple-reporter";
import { faker } from "@faker-js/faker";

describe("DummyJSON API - Testes de Integração e Contrato", () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = "https://dummyjson.com";

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe("Cenários de Cadastro e Escrita (POST e PUT)", () => {
    it("Cenário 1: Deve cadastrar um novo produto com sucesso utilizando dados dinâmicos", async () => {
      const productName = faker.commerce.productName();
      const productPrice = Number(faker.commerce.price({ min: 10, max: 1000 }));

      const response = await p.spec().post(`${baseUrl}/products/add`).withJson({
        title: productName,
        description: faker.commerce.productDescription(),
        price: productPrice,
        category: "smartphones",
      });

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(response.json).toHaveProperty("id");
    });

    it("Cenário 2: Deve atualizar as informações de um produto existente via PUT", async () => {
      const updatedTitle = "Smartphone Teste Atualizado QA";

      const response = await p.spec().put(`${baseUrl}/products/1`).withJson({
        title: updatedTitle,
        price: 999.99,
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(response.json.title).toEqual(updatedTitle);
    });
  });

  describe("Cenários de Consulta e Processamento (GET e Carrinhos)", () => {
    it("Cenário 3: Deve buscar os detalhes de um produto específico com sucesso", async () => {
      const response = await p.spec().get(`${baseUrl}/products/1`);

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(response.json).toHaveProperty("id", 1);
    });

    it("Cenário 4: Deve processar a criação de um novo carrinho de compras com múltiplos itens", async () => {
      const response = await p
        .spec()
        .post(`${baseUrl}/carts/add`)
        .withJson({
          userId: 1,
          products: [
            { id: 1, quantity: 2 },
            { id: 2, quantity: 1 },
          ],
        });

      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(response.json).toHaveProperty("total");
    });

    it("Cenário 5: Deve validar o comportamento ao buscar um produto inexistente (Tratamento de Erro)", async () => {
      const response = await p.spec().get(`${baseUrl}/products/999999`);

      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(response.json.message).toEqual(
        "Product with id '999999' not found",
      );
    });
  });
});
