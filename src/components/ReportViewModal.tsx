import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type ReportViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'flujo' | 'categorias' | 'morosidad';
  title: string;
};

export function ReportViewModal({ isOpen, onClose, reportType, title }: ReportViewModalProps) {
  const supabase = createClient();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    }
  }, [isOpen, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    if (reportType === 'flujo') {
      const { data: trans } = await supabase.from('transacciones').select('tipo, monto_hnl, fecha, descripcion, categorias(nombre)').eq('anulado', false).order('fecha', { ascending: false });
      if (trans) setData(trans);
    } else if (reportType === 'categorias') {
      const { data: catData } = await supabase.from('transacciones').select('monto_hnl, tipo, categorias(nombre)').eq('anulado', false);
      if (catData) {
        const grouped: Record<string, number> = {};
        catData.forEach(t => {
          const cat: any = t.categorias;
          const name = (Array.isArray(cat) ? cat[0]?.nombre : cat?.nombre) || 'Sin Categoría';
          grouped[name] = (grouped[name] || 0) + parseFloat(t.monto_hnl as any);
        });
        setData(Object.entries(grouped).map(([name, total]) => ({ name, total })));
      }
    } else if (reportType === 'morosidad') {
      const { data: deudas } = await supabase.from('cuentas_por_cobrar').select('*, pacientes(nombre_completo, codigo_interno)').neq('estado', 'pagada').order('fecha_vencimiento', { ascending: true });
      if (deudas) setData(deudas);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${val?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Previsualización de datos antes de exportar</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium shadow-sm"
            >
              <FileSpreadsheet size={18} /> Exportar Excel (CSV)
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium"
            >
              <FileText size={18} /> Imprimir PDF
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
              <p className="font-medium">Generando reporte...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
              No se encontraron datos para este reporte.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-4 text-sm text-slate-600">
                          {typeof val === 'object' ? JSON.stringify(val) : val?.toString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
