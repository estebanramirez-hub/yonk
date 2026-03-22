export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  category: 'ropa' | 'accesorios';
  subcategory: string;
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  customerName?: string;
  paymentMethod?: string;
  createdAt: any;
}
