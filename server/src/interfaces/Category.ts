export interface Category {
    id: number;
    name: string;
    type: "income" | "expense";
    user_id: number | null;
    icon: string;
    color: string;
}