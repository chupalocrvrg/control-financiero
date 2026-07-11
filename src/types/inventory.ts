export interface Article {
  id: string;
  name: string;
  quantity: number; // Total quantity across all warehouses
  series?: string; // Optional serial number
  minStockAlert: number; // Required minimum stock for alert
  userId: string; // Owner enterprise ID
  createdAt: any;
}

export interface Warehouse {
  id: string;
  name: string;
  assignedPerson: string; // Name of person assigned
  userId: string; // Owner enterprise ID
  createdAt: any;
}

export interface WarehouseInventory {
  id: string; // e.g., `${warehouseId}_${articleId}`
  warehouseId: string;
  articleId: string;
  quantity: number;
  userId: string;
}

export interface TransferArticle {
  articleId: string;
  name: string;
  quantity: number;
  series?: string;
}

export interface Transfer {
  id: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  articles: TransferArticle[];
  reason: string; // 'PRÉSTAMO' | 'DEVOLUCIÓN' | 'TRASLADO' | 'OTRO'
  comment: string;
  timestamp: any;
  userId: string;
}

export interface LoanReturnArticle {
  articleId: string;
  name: string;
  quantity: number;
  series?: string;
}

export interface LoanReturn {
  id: string;
  type: 'LOAN' | 'RETURN';
  commercialHouse: string; // Searchable/predictive
  warehouseId: string; // Selected warehouse (empty for direct sale if LOAN)
  warehouseName: string;
  isDirectSale?: boolean; // Only for LOAN
  articles: LoanReturnArticle[];
  comment: string;
  personName: string; // Person who delivers/receives
  timestamp: any;
  userId: string;
}

export interface SoldArticle {
  articleId: string;
  name: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  isGift: boolean;
}

export interface InventorySale {
  id: string;
  clientName: string;
  sellerId: string; // Registered employee ID
  sellerName: string;
  soldArticles: SoldArticle[];
  timestamp: any;
  userId: string;
}
