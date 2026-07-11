import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Warehouse, Article, WarehouseInventory, InventorySale } from '../../types/inventory';
import { executeInventorySale } from '../../lib/inventory-db';
import { ShoppingCart, AlertTriangle, Plus, Trash2, Calendar, FileText, Check, User, Gift, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface Employee {
  id: string;
  name: string;
  lastName: string;
  role: 'vendedor' | 'cobrador' | 'ambos';
  userId?: string;
}

interface SaleItemRow {
  articleId: string;
  warehouseId: string;
  quantity: number;
  isGift: boolean;
}

export default function SalesTab() {
  const { user, profile } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [inventories, setInventories] = useState<WarehouseInventory[]>([]);
  const [sellers, setSellers] = useState<Employee[]>([]);
  const [sales, setSales] = useState<InventorySale[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [clientName, setClientName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItemRow[]>([{ articleId: '', warehouseId: '', quantity: 1, isGift: false }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentEnterpriseId = profile?.role === 'BODEGUERO' ? profile?.enterpriseId : user?.uid;

  useEffect(() => {
    if (currentEnterpriseId) {
      fetchData();
    }
  }, [currentEnterpriseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch warehouses
      const whQ = query(collection(db, 'warehouses'), where('userId', '==', currentEnterpriseId));
      const whSnap = await getDocs(whQ);
      const whList = whSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
      setWarehouses(whList);

      // Fetch articles
      const artQ = query(collection(db, 'articles'), where('userId', '==', currentEnterpriseId));
      const artSnap = await getDocs(artQ);
      const artList = artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(artList);

      // Fetch warehouse inventories
      const invQ = query(collection(db, 'warehouse_inventory'), where('userId', '==', currentEnterpriseId));
      const invSnap = await getDocs(invQ);
      const invList = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseInventory));
      setInventories(invList);

      // Fetch sellers (employees with role 'vendedor' or 'ambos')
      // Supports filtering by enterprise, but also fetches unassigned for backward compatibility
      const empSnap = await getDocs(collection(db, 'employees'));
      const empList = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      const filteredSellers = empList.filter(emp => 
        (emp.role === 'vendedor' || emp.role === 'ambos') && 
        (!emp.userId || emp.userId === currentEnterpriseId)
      );
      setSellers(filteredSellers);
      if (filteredSellers.length > 0 && !sellerId) {
        setSellerId(filteredSellers[0].id);
      }

      // Fetch past inventory sales
      const salesQ = query(collection(db, 'inventory_sales'), where('userId', '==', currentEnterpriseId));
      const salesSnap = await getDocs(salesQ);
      const salesList = salesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
        } as unknown as InventorySale;
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setSales(salesList);

      // Set default warehouse for initial item row
      if (whList.length > 0) {
        setSaleItems([{ articleId: '', warehouseId: whList[0].id, quantity: 1, isGift: false }]);
      }
    } catch (err: any) {
      console.error('Error fetching inventory sales data:', err);
      setError('No se pudieron cargar los datos de ventas.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setSaleItems([
      ...saleItems, 
      { 
        articleId: '', 
        warehouseId: warehouses[0]?.id || '', 
        quantity: 1, 
        isGift: false 
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (saleItems.length === 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SaleItemRow, value: any) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], [field]: value };
    setSaleItems(updated);
  };

  // Get current stock for an article in a specific warehouse
  const getAvailableStock = (articleId: string, whId: string): number => {
    if (!articleId || !whId) return 0;
    const inv = inventories.find(i => i.warehouseId === whId && i.articleId === articleId);
    return inv ? inv.quantity : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentEnterpriseId) return;

    if (!clientName.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    if (!sellerId) {
      setError('Debe seleccionar el vendedor que realizó la operación.');
      return;
    }

    // Validate articles list
    if (saleItems.some(item => !item.articleId || !item.warehouseId)) {
      setError('Por favor seleccione un artículo y una bodega en cada fila.');
      return;
    }

    // Validate quantities and stock availability (with batch aggregation for identical article+warehouse rows)
    const stockChecks: Record<string, number> = {};
    for (const item of saleItems) {
      if (item.quantity <= 0) {
        setError('Las cantidades a vender deben ser mayores a 0.');
        return;
      }

      const key = `${item.warehouseId}_${item.articleId}`;
      stockChecks[key] = (stockChecks[key] || 0) + item.quantity;

      const available = getAvailableStock(item.articleId, item.warehouseId);
      if (stockChecks[key] > available) {
        const articleName = articles.find(a => a.id === item.articleId)?.name || 'Artículo';
        const whName = warehouses.find(w => w.id === item.warehouseId)?.name || 'Bodega';
        setError(`Stock insuficiente en "${whName}" para "${articleName}". Solicitado en total: ${stockChecks[key]} uds, Disponible: ${available} uds.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const selectedSeller = sellers.find(s => s.id === sellerId);
      const sellerName = selectedSeller ? `${selectedSeller.name} ${selectedSeller.lastName}` : 'Vendedor';

      await executeInventorySale(
        currentEnterpriseId,
        clientName.trim(),
        sellerId,
        sellerName,
        saleItems
      );

      setSuccess('¡Venta de inventario registrada con éxito!');
      setClientName('');
      setSaleItems([{ 
        articleId: '', 
        warehouseId: warehouses[0]?.id || '', 
        quantity: 1, 
        isGift: false 
      }]);
      
      await fetchData();
    } catch (err: any) {
      console.error('Error saving inventory sale:', err);
      setError('Error al guardar el registro de venta. Por favor intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const safeFormatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return format(d, 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Area */}
      <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Registrar Venta</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Despacha artículos vendidos o de regalo.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {warehouses.length === 0 ? (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl text-yellow-800 dark:text-yellow-400 text-xs font-medium">
            <p className="font-bold uppercase tracking-wider mb-1">Se requiere al menos 1 bodega</p>
            <p>Para registrar ventas, necesitas tener al menos una bodega activa con inventario disponible.</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl text-yellow-800 dark:text-yellow-400 text-xs font-medium">
            <p className="font-bold uppercase tracking-wider mb-1">Se requieren vendedores registrados</p>
            <p>Por favor, registra empleados con rol de 'vendedor' o 'ambos' en el módulo de Comercio antes de proceder.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Nombre del Cliente *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. María Auxiliadora"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 uppercase font-bold"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Vendedor Responsable *</label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 uppercase font-bold"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 font-medium mt-1">Control interno: Permite asociar y comisionar la venta al vendedor seleccionado.</p>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Artículos vendidos / Regalos</label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Artículo
                </button>
              </div>

              <div className="space-y-3">
                {saleItems.map((item, index) => {
                  const available = getAvailableStock(item.articleId, item.warehouseId);
                  return (
                    <div key={index} className="bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Artículo</label>
                          <select
                            value={item.articleId}
                            onChange={(e) => handleItemChange(index, 'articleId', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                          >
                            <option value="">-- Seleccionar --</option>
                            {articles.map(art => (
                              <option key={art.id} value={art.id}>{art.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Desde Bodega</label>
                          <select
                            value={item.warehouseId}
                            onChange={(e) => handleItemChange(index, 'warehouseId', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                          >
                            {warehouses.map(wh => (
                              <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'isGift', !item.isGift)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all",
                              item.isGift 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-900/50" 
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            )}
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {item.isGift ? 'Regalo' : 'Venta Estándar'}
                          </button>

                          {item.articleId && (
                            <span className="text-[9px] font-bold uppercase text-neutral-400">
                              Disponibles: <strong className="text-neutral-600 dark:text-neutral-300">{available} uds</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <input
                              type="number"
                              min={1}
                              max={available || 1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={saleItems.length === 1}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-indigo-500/15 transition-all disabled:opacity-50"
            >
              {submitting ? 'Procesando Despacho...' : 'Registrar y Despachar'}
            </button>
          </form>
        )}
      </div>

      {/* History Log Panel */}
      <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Historial de Ventas</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Despachos registrados y asignaciones comerciales.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-neutral-500">Cargando ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 italic text-sm">
            No se han registrado ventas de inventario aún.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {sales.map(sale => (
              <div 
                key={sale.id}
                className="bg-neutral-50 dark:bg-neutral-800/20 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4 shadow-sm"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                        Venta Bodega
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">ID: {sale.id.substring(0, 8)}</span>
                    </div>
                    <div className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                      Cliente: <strong className="text-indigo-600 dark:text-indigo-400">{sale.clientName}</strong>
                    </div>
                    <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight flex items-center gap-1">
                      Vendedor Asignado: <strong className="text-neutral-700 dark:text-neutral-200 uppercase">{sale.sellerName}</strong>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeFormatDate(sale.timestamp)}
                  </div>
                </div>

                {/* Articles List */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Artículos Despachados</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sale.soldArticles.map((art, idx) => (
                      <div key={idx} className="flex flex-col p-2.5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase truncate" title={art.name}>{art.name}</span>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest",
                            art.isGift 
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                              : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                          )}>
                            {art.isGift ? 'Regalo' : 'Vendido'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold uppercase">
                          <span>Bodega: <strong className="text-neutral-600 dark:text-neutral-300">{art.warehouseName}</strong></span>
                          <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{art.quantity} uds</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
