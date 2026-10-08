import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Eye, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle,
  X,
  MessageCircle,
  Copy,
  Sparkles,
  ShieldCheck,
  Truck,
  Check
} from 'lucide-react';
import { EmailLog } from '../types';

interface EmailNotificationsModuleProps {
  emailLogs: EmailLog[];
  onSendTestEmail: (recipientEmail: string, recipientName: string, subject: string, bodyHtml: string) => Promise<void>;
}

export const EmailNotificationsModule: React.FC<EmailNotificationsModuleProps> = ({
  emailLogs,
  onSendTestEmail,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'logs'>('whatsapp');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Send Custom Test Email Form State
  const [testEmail, setTestEmail] = useState('cliente.joyas@gmail.com');
  const [testName, setTestName] = useState('Valeria Mendoza');
  const [testSubject, setTestSubject] = useState('✨ Tu joya Obsidiana PED-2026-0100 está en preparación');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // WhatsApp Templates
  const whatsappTemplates = [
    {
      id: 'confirmacion',
      title: '1. Confirmación de Compra & Pago',
      badge: 'Al Registrar Pedido',
      text: `¡Hola {CLIENTE}! ✨ Te saludamos de *Obsidiana Joyería Perú*.\n\nHemos confirmado tu orden *{PEDIDO}* con éxito. Tu joya en plata fina ya pasó a nuestro taller para su revisión, pulido y empaque de lujo en estuche rígido con certificado de garantía.\n\n🔍 Tu código de seguimiento es: *{TRACKING}*\n\nTe notificaremos apenas tu paquete sea despachado. ¡Muchas gracias por tu confianza! 💎`,
    },
    {
      id: 'despacho',
      title: '2. Pedido Despachado (Guía / Shalom / Motorizado)',
      badge: 'Al Salir a Reparto',
      text: `¡Hola {CLIENTE}! 🚚 Te informamos que tu pedido *{PEDIDO}* de *Obsidiana Joyería* ya ha sido despachado.\n\n📦 *Detalles del Envío:*\n• Código de Rastreo: *{TRACKING}*\n• Destino: {DESTINO}\n• Modalidad: {AGENCIA_COURIER}\n\nPuedes consultar el estado de tu entrega cuando gustes. ¡Esperamos que te encante tu nueva joya! ✨`,
    },
    {
      id: 'entrega',
      title: '3. Entrega Conforme & Cuidados de la Joya',
      badge: 'Post-Venta',
      text: `¡Hola {CLIENTE}! 🎁 Tu pedido *{PEDIDO}* figura como ENTREGADO.\n\nEsperamos que tu joya haya llegado en perfectas condiciones. Recuerda que para mantener el brillo de tu pieza de plata 925/950:\n1. Utiliza el paño de pulido seco incluido.\n2. Evita contacto directo con perfumes o químicos abrasivos.\n3. Guárdala en su estuche cuando no la uses.\n\n¿Nos regalarías una foto etiquetándonos en Instagram? 📸 ¡Nos encantaría verte lucir tu joya!`,
    },
  ];

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setIsSending(true);

    const sampleBody = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="background: #18181b; padding: 32px 24px; text-align: center;">
          <h1 style="color: #d4af37; font-size: 20px; font-weight: 900; letter-spacing: 4px; margin: 0; text-transform: uppercase;">OBSIDIANA</h1>
          <p style="color: #a8a29e; font-size: 11px; margin: 6px 0 0; letter-spacing: 2px;">JOYERÍA & PLATA FINA 925 / 950</p>
        </div>
        <div style="padding: 32px 24px; color: #1c1917;">
          <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; color: #1c1917;">¡Hola ${testName}! ✨</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #57534e;">
            Tu pedido ha sido procesado exitosamente por nuestro equipo de orfebres. Tu joya se encuentra en su estuche de terciopelo, debidamente protegida y acompañada por su certificado de garantía.
          </p>
          <div style="background: #fdfbf7; border: 1px solid #f5eedc; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #78716c;"><strong>Asunto:</strong> ${testSubject}</p>
            <p style="margin: 0 0 8px; font-size: 12px; color: #78716c;"><strong>Código de Trazabilidad:</strong> <span style="font-family: monospace; font-weight: bold; color: #d4af37;">TRK-${Math.floor(10000 + Math.random() * 90000)}</span></p>
            <p style="margin: 0; font-size: 12px; color: #78716c;"><strong>Fecha de Registro:</strong> ${new Date().toLocaleString('es-PE')}</p>
          </div>
          <p style="font-size: 12px; line-height: 1.6; color: #78716c;">
            Si tienes dudas o necesitas coordinar la entrega express, responde a este correo o escríbenos a nuestro WhatsApp oficial.
          </p>
        </div>
        <div style="background: #fafaf9; padding: 16px 24px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="font-size: 11px; color: #a8a29e; margin: 0;">Obsidiana Joyería Perú © 2026 — Lima, Perú</p>
        </div>
      </div>
    `;

    try {
      await onSendTestEmail(testEmail, testName, testSubject, sampleBody);
      setStatusMsg('¡Notificación enviada con éxito! Se ha añadido al historial de auditoría.');
    } catch (err: any) {
      setStatusMsg(`Error al enviar: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">COMUNICACIONES & MENSAJERÍA</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">Centro de Notificaciones</h1>
          <p className="text-xs text-stone-500 mt-1 font-light">
            Plantillas comerciales para WhatsApp, notificaciones automáticas por correo y registro de auditoría.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-stone-100 p-1 rounded-xl flex items-center space-x-1 border border-stone-200">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'whatsapp' ? 'bg-stone-950 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plantillas WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'email' ? 'bg-stone-950 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulador Correo</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'logs' ? 'bg-stone-950 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Historial ({emailLogs.length})</span>
          </button>
        </div>
      </div>

      {/* View 1: WhatsApp Templates */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whatsappTemplates.map((tmpl) => (
            <div key={tmpl.id} className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {tmpl.badge}
                  </span>
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-black text-stone-900">{tmpl.title}</h3>
                
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {tmpl.text}
                </div>
              </div>

              <button
                onClick={() => handleCopyText(tmpl.id, tmpl.text)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  copiedTemplate === tmpl.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-950 hover:bg-stone-800 text-amber-300'
                }`}
              >
                {copiedTemplate === tmpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Plantilla Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Mensaje</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Email Simulator */}
      {activeTab === 'email' && (
        <div className="max-w-xl mx-auto bg-white border border-stone-200/80 p-6 rounded-2xl shadow-xs space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Simulador de Correo HTML Obsidiana</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Envía un correo de prueba con la plantilla oficial de joyería y firma de marca.
            </p>
          </div>

          {statusMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendTest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico Destino</label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Asunto de Notificación</label>
              <input
                type="text"
                required
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-stone-950/10 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando Correo...' : 'Disparar Correo de Prueba'}</span>
            </button>
          </form>
        </div>
      )}

      {/* View 3: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Historial de Notificaciones Disparadas</span>
            </h3>
            <span className="text-xs text-stone-500 font-bold">{emailLogs.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-950 text-stone-200 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Asunto / Tipo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-xs">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      No hay registros en el historial todavía.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {new Date(log.sentAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{log.recipientName}</div>
                        <div className="text-[11px] text-stone-400">{log.recipientEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-stone-800 font-medium truncate max-w-[240px]">{log.subject}</div>
                        <span className="text-[10px] text-amber-700 font-mono font-bold">
                          {log.trackingCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Enviado</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedEmail(log)}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-lg text-xs font-bold transition-all ml-auto cursor-pointer"
                        >
                          Ver HTML
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HTML Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div>
                <h2 className="text-sm font-black text-stone-900">Vista Previa de Correo Oficial</h2>
                <p className="text-xs text-stone-500">Para: {selectedEmail.recipientName} ({selectedEmail.recipientEmail})</p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-stone-400 hover:text-stone-900 p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-stone-100 text-stone-900 min-h-[300px]">
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
            </div>

            <div className="px-6 py-3 bg-white border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
