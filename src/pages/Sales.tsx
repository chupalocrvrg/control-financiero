import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy, where } from 'firebase/firestore';
import { Plus, Pencil, Trash2, ShoppingCart, AlertCircle, Save, X, Calendar, User, DollarSign, Bike } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  lastName: string;
  role: 'vendedor' | 'cobrador' | 'ambos';
}

interface Sale {
  id: string;
  date: string;
  type: 'contado' | 'credito';
  employeeId: string;
  isMoto: boolean;
  motoType: 'combustion' | 'electrico' | null;
  clientName?: string;
  article: string;
  totalValue: number;
  createdAt: any;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, originalUser } = useAuth();
  const { showToast, showConfirm } = useNotification();

  const isSuperAdmin = profile?.role === 'ADMIN' || originalUser?.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL;

  const [enterprises, setEnterprises] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>(''); // list filter
  const [formEnterpriseId, setFormEnterpriseId] = useState<string>(''); // form creator filter

  const currentEnterpriseId = isSuperAdmin
    ? (selectedEnterpriseId || user?.uid || '')
    : (profile?.role === 'enterprise' ? user?.uid : (profile?.enterpriseId || user?.uid || ''));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterDateType, setFilterDateType] = useState<'exacta' | 'rango'>('exacta');
  const [filterDateExact, setFilterDateExact] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  
  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'contado' as 'contado' | 'credito',
    employeeId: '',
    isMoto: false,
    motoType: 'combustion' as 'combustion' | 'electrico' | null,
    totalValue: '',
    clientName: '',
    article: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniqueClients = Array.from(new Set(sales.map(s => s.clientName).filter(Boolean))) as string[];

  const filteredSales = sales.filter(sale => {
    let match = true;
    const emp = employees.find(e => e.id === sale.employeeId);
    const empName = emp ? `${emp.name} ${emp.lastName}`.toLowerCase() : '';
    
    if (filterEmployee && !empName.includes(filterEmployee.toLowerCase())) match = false;
    if (filterClient && !(sale.clientName || '').toLowerCase().includes(filterClient.toLowerCase())) match = false;
    
    if (filterDateType === 'exacta' && filterDateExact) {
      if (sale.date !== filterDateExact) match = false;
    } else if (filterDateType === 'rango') {
      if (filterDateStart && sale.date < filterDateStart) match = false;
      if (filterDateEnd && sale.date > filterDateEnd) match = false;
    }
    
    return match;
  });

  useEffect(() => {
    if (user) {
      fetchData();
      if (isSuperAdmin) {
        loadEnterprises();
      }
    }
  }, [user, isSuperAdmin, selectedEnterpriseId]);

  const loadEnterprises = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'enterprise'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Empresa sin nombre',
        email: doc.data().email
      }));
      setEnterprises(list);
    } catch (error) {
      console.error('Error loading enterprises for SuperAdmin sales:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let salesList: Sale[] = [];
      let empList: Employee[] = [];

      if (isSuperAdmin) {
        // SuperAdmin fetches all documents and applies selectedEnterpriseId filter
        const [allSales, allEmployees] = await Promise.all([
          getDocs(collection(db, 'sales')),
          getDocs(collection(db, 'employees'))
        ]);
        
        salesList = allSales.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        empList = allEmployees.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        
        if (selectedEnterpriseId) {
          salesList = salesList.filter((s: any) => s.enterpriseId === selectedEnterpriseId);
          empList = empList.filter((e: any) => e.enterpriseId === selectedEnterpriseId);
        }
      } else {
        const tenantId = profile?.role === 'enterprise' ? user?.uid : (profile?.enterpriseId || user?.uid || '');
        const salesQ = query(collection(db, 'sales'), where('enterpriseId', '==', tenantId));
        const empQ = query(collection(db, 'employees'), where('enterpriseId', '==', tenantId));
        
        const [salesRes, empRes] = await Promise.all([
          getDocs(salesQ),
          getDocs(empQ)
        ]);
        
        salesList = salesRes.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        empList = empRes.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      }

      salesList.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setSales(salesList);

      empList.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(empList);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormEnterpriseId((sale as any).enterpriseId || '');
      setFormData({
        date: sale.date,
        type: sale.type,
        employeeId: sale.employeeId,
        isMoto: sale.isMoto,
        motoType: sale.motoType || 'combustion',
        totalValue: sale.totalValue.toString(),
        clientName: sale.clientName || '',
        article: sale.article || ''
      });
    } else {
      setEditingSale(null);
      const initialEntId = selectedEnterpriseId || '';
      setFormEnterpriseId(initialEntId);
      
      // Filter employees of the chosen initial company to select a valid seller
      const validEmps = initialEntId
        ? employees.filter(e => e.enterpriseId === initialEntId && (e.role === 'vendedor' || e.role === 'ambos'))
        : employees.filter(e => e.role === 'vendedor' || e.role === 'ambos');

      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'contado',
        employeeId: validEmps[0]?.id || '',
        isMoto: false,
        motoType: 'combustion',
        totalValue: '',
        clientName: '',
        article: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      const targetEnterpriseId = isSuperAdmin
        ? (formEnterpriseId || user.uid)
        : (profile?.role === 'enterprise' ? user.uid : (profile?.enterpriseId || user.uid || ''));

      const saleData = {
        date: formData.date,
        type: formData.type,
        employeeId: formData.employeeId,
        isMoto: formData.isMoto,
        motoType: formData.isMoto ? formData.motoType : null,
        totalValue: parseFloat(formData.totalValue) || 0,
        clientName: formData.clientName,
        article: formData.article,
        enterpriseId: targetEnterpriseId
      };

      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
      } else {
        await addDoc(collection(db, 'sales'), {
          ...saleData,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving sale:', err);
      setError('Error al guardar venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('Eliminar Venta', '¿Está seguro de eliminar este registro?', { type: 'danger' })) {
      try {
        await deleteDoc(doc(db, 'sales', id));
        fetchData();
        showToast('Venta eliminada exitosamente', 'success');
      } catch (err: any) {
        console.error('Error deleting sale:', err);
        setError('Error al eliminar registro');
        showToast('Error al eliminar registro', 'error');
      }
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.name} ${emp.lastName}` : 'Desconocido';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-500" />
            Registro de Ventas
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Gestión y registro de ventas por empleados</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}


      {isSuperAdmin && (
        <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider">Filtro de Empresa (SuperAdmin)</h4>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">Verifique las ventas registradas filtrando por empresa matriz.</p>
            </div>
          </div>
          <select
            value={selectedEnterpriseId}
            onChange={(e) => setSelectedEnterpriseId(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 font-bold dark:text-neutral-100 min-w-[240px]"
          >
            <option value="">-- Ver todas las empresas --</option>
            {enterprises.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.name} ({ent.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 mb-6">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Vendedor</label>
            <input 
              type="text" 
              placeholder="Buscar vendedor..."
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Cliente</label>
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <div className="flex gap-2 mb-1">
              <label className="text-xs font-medium text-neutral-500 flex-1">Fecha</label>
              <select 
                value={filterDateType} 
                onChange={e => setFilterDateType(e.target.value as any)}
                className="text-xs bg-transparent text-indigo-600 font-medium outline-none cursor-pointer"
              >
                <option value="exacta">Exacta</option>
                <option value="rango">Rango</option>
              </select>
            </div>
            {filterDateType === 'exacta' ? (
              <input 
                type="date"
                value={filterDateExact}
                onChange={e => setFilterDateExact(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={filterDateStart}
                  onChange={e => setFilterDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-neutral-400">a</span>
                <input 
                  type="date"
                  value={filterDateEnd}
                  onChange={e => setFilterDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            No hay ventas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Artículo / Producto Detallado</th>
                  <th className="px-6 py-4 text-right">Valor Final</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                      {sale.date}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                      {getEmployeeName(sale.employeeId)}
                    </td>
                    <td className="px-6 py-4">
                      {sale.clientName ? (
                        <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-800/40 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 w-fit">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>{sale.clientName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${sale.type === 'contado' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {sale.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sale.isMoto ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                            <Bike className="w-4 h-4" />
                            <span className="capitalize text-xs">Moto {sale.motoType}</span>
                          </div>
                          {sale.article ? (
                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-indigo-50/50 dark:bg-indigo-900/10 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/20 w-fit">{sale.article}</div>
                          ) : (
                            <div className="text-xs text-neutral-400 italic">Detalle de moto pendiente</div>
                          )}
                        </div>
                      ) : (
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/20 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 w-fit">
                          {sale.article || 'Mercadería General'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${sale.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(sale)}
                          className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-500" />
                {editingSale ? 'Editar Venta' : 'Registrar Venta'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {isSuperAdmin && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-2">
                  <label className="block text-xs font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider pl-1">
                    Asignar Empresa (SuperAdmin)
                  </label>
                  <select
                    value={formEnterpriseId}
                    onChange={(e) => {
                      const newEntId = e.target.value;
                      setFormEnterpriseId(newEntId);
                      
                      // Auto-select the first employee of this new company to prevent mismatch
                      const validEmps = newEntId
                        ? employees.filter(emp => emp.enterpriseId === newEntId && (emp.role === 'vendedor' || emp.role === 'ambos'))
                        : employees.filter(emp => emp.role === 'vendedor' || emp.role === 'ambos');
                      setFormData(prev => ({ ...prev, employeeId: validEmps[0]?.id || '' }));
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-amber-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-bold dark:text-white"
                  >
                    <option value="">-- Asignar al SuperAdmin --</option>
                    {enterprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" /> Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  list="clients-list"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  placeholder="Ej. Juan Pérez"
                />
                <datalist id="clients-list">
                  {uniqueClients.map(client => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
              </div>


              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-neutral-400" /> Artículo Vendido
                </label>
                <input
                  type="text"
                  required
                  value={formData.article}
                  onChange={(e) => setFormData({...formData, article: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  placeholder="Ej. Moto XYZ / Repuestos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neutral-400" /> Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-neutral-400" /> Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'contado' | 'credito'})}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  >
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" /> Vendedor
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                >
                  <option value="" disabled>Seleccione un vendedor...</option>
                  {employees
                    .filter(e => {
                      if (e.role !== 'vendedor' && e.role !== 'ambos') return false;
                      if (isSuperAdmin) {
                        return e.enterpriseId === formEnterpriseId;
                      }
                      return true;
                    })
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>
                    ))
                  }
                </select>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMoto}
                    onChange={(e) => setFormData({...formData, isMoto: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                    <Bike className="w-4 h-4 text-indigo-500" />
                    ¿La venta incluye una Moto?
                  </span>
                </label>
                
                {formData.isMoto && (
                  <div className="pl-8 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="motoType"
                        value="combustion"
                        checked={formData.motoType === 'combustion'}
                        onChange={() => setFormData({...formData, motoType: 'combustion'})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Combustión</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="motoType"
                        value="electrico"
                        checked={formData.motoType === 'electrico'}
                        onChange={() => setFormData({...formData, motoType: 'electrico'})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Eléctrica</span>
                    </label>
                  </div>
                )}
                {formData.isMoto && (
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 pl-8">
                    * El valor de las motos no sumará al cumplimiento de presupuesto en dinero, solo sumará en el indicador de unidades.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  Valor Total {formData.isMoto ? '(Final de la moto)' : ''}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalValue}
                    onChange={(e) => setFormData({...formData, totalValue: e.target.value})}
                    className="w-full pl-8 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
