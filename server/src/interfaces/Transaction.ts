export interface Transaction {
    id: number;
    description: string;
    value: number;
    type: "income" | "expense";
    category: string;
    date: string;
};