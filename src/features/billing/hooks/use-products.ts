import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Product,
  ProductCategory,
  ProductUnit,
  CreateProductDTO,
  UpdateProductDTO,
} from "../schemas/product";

// --- Mock Data ---
let mockProducts: Product[] = [
  {
    id: "p1",
    type: "goods",
    name: "MacBook Pro M3",
    sku: "MBP-M3-14",
    price: 1999,
    categoryId: "c1",
    unitId: "u1",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "p2",
    type: "service",
    name: "Consulting Hour",
    sku: "CONS-HR",
    price: 150,
    categoryId: "c2",
    unitId: "u2",
    isActive: true,
    createdAt: new Date(),
  },
];

let mockCategories: ProductCategory[] = [
  { id: "c1", name: "Electronics", description: "Laptops, Phones, etc." },
  { id: "c2", name: "Services", description: "Professional services" },
];

let mockUnits: ProductUnit[] = [
  { id: "u1", name: "Piece", abbreviation: "pcs" },
  { id: "u2", name: "Hour", abbreviation: "hr" },
  { id: "u3", name: "Kilogram", abbreviation: "kg" },
];

// --- API Functions ---
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchProducts = async (): Promise<Product[]> => {
  await delay(500);
  return [...mockProducts];
};

const createProduct = async (data: CreateProductDTO): Promise<Product> => {
  await delay(500);
  const newProduct: Product = {
    ...data,
    id: `p${Date.now()}`,
    createdAt: new Date(),
  };
  mockProducts = [newProduct, ...mockProducts];
  return newProduct;
};

const updateProduct = async ({ id, data }: { id: string; data: UpdateProductDTO }): Promise<Product> => {
  await delay(500);
  const index = mockProducts.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Product not found");
  mockProducts[index] = { ...mockProducts[index], ...data, updatedAt: new Date() };
  return mockProducts[index];
};

const deleteProduct = async (id: string): Promise<void> => {
  await delay(500);
  mockProducts = mockProducts.filter((p) => p.id !== id);
};

// --- Hooks ---
export function useProducts() {
  return useQuery({
    queryKey: ["billing", "products"],
    queryFn: fetchProducts,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ["billing", "product-categories"],
    queryFn: async () => {
      await delay(300);
      return mockCategories;
    },
  });
}

export function useProductUnits() {
  return useQuery({
    queryKey: ["billing", "product-units"],
    queryFn: async () => {
      await delay(300);
      return mockUnits;
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "products"] });
    },
  });
}
