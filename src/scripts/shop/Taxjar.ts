import { Estimate, Transaction } from "./shop.types";

export default class Taxjar {
  private baseUrl: string = "http://localhost:3000";
  private fromAddress = {
    street: "11100 Wildlife Center Dr",
    city: "Reston",
    state: "VA",
    zip: "20190-5361",
    country: "US",
  };

  async estimateTax(order: Estimate): Promise<number> {
    order.from_street = this.fromAddress.street;
    order.from_city = this.fromAddress.city;
    order.from_state = this.fromAddress.state;
    order.from_zip = this.fromAddress.zip;
    order.from_country = this.fromAddress.country;

    const response = await fetch(`${this.baseUrl}/estimate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      throw new Error("Failed to estimate tax");
    }

    const resJson = await response.json();

    return resJson.amount_to_collect;
  }

  async createEnTransaction(transaction: Transaction): Promise<any> {
    transaction.from_street = this.fromAddress.street;
    transaction.from_city = this.fromAddress.city;
    transaction.from_state = this.fromAddress.state;
    transaction.from_zip = this.fromAddress.zip;
    transaction.from_country = this.fromAddress.country;

    const response = await fetch(`${this.baseUrl}/en-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction }),
    });

    if (!response.ok) {
      throw new Error("Failed to create EN transaction");
    }

    return response.json();
  }
}
