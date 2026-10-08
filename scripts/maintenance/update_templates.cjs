const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PosModule.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const replacement = `
              {/* VARIANT 1: NOTA DE VENTA LIMA (EXACT MATCH TO MOCKUP 1) */}
              {(receiptTab === 'lima' || receiptTab === 'todas') && (
                <div className="max-w-2xl mx-auto border border-[#61564A] bg-white text-slate-900 overflow-hidden font-sans shadow-sm mb-4">
                  
                  {/* Top Black Header */}
                  <div className="bg-[#161716] text-[#E4DFD7] p-4 sm:p-5 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img src="/assets/Icono/icono-blanco.jpeg" alt="Obsidiana Logo" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border border-[#61564A]" />
                      <div>
                        <h1 className="font-serif font-medium text-2xl sm:text-4xl tracking-widest uppercase leading-none">
                          OBSIDIANA
                        </h1>
                        <p className="text-[8px] sm:text-[10px] font-medium text-[#A59B8F] uppercase tracking-[0.25em] mt-1.5 ml-0.5">
                          JOYERÍA EN PLATA 925/950
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end space-y-1">
                      <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white mb-1">NOTA DE VENTA</p>
                      <div className="bg-white text-[#161716] font-bold font-mono text-[10px] sm:text-xs px-3 py-1 w-32 sm:w-40 text-center">
                        N° {generatedReceipt.receiptNumber}
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-[#A59B8F] mt-1">FECHA: {generatedReceipt.date}</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-5">
                    {/* DATOS DEL CLIENTE Box Grid */}
                    <div className="grid grid-cols-12 gap-4 text-xs">
                      {/* Left Details (8 cols) */}
                      <div className="col-span-12 sm:col-span-8 flex flex-col">
                        <div className="bg-[#E4DFD7] px-3 py-1.5 font-bold text-[10px] text-[#161716] uppercase tracking-widest">
                          DATOS DEL CLIENTE
                        </div>
                        <div className="border border-t-0 border-[#E4DFD7] p-3 space-y-2.5 flex-1 bg-white">
                          <div className="flex items-center">
                            <User className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-24 uppercase text-[9px] text-slate-600 font-bold tracking-wider">NOMBRE:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.name}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-24 uppercase text-[9px] text-slate-600 font-bold tracking-wider">DNI / RUC:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.doc}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-24 uppercase text-[9px] text-slate-600 font-bold tracking-wider">TELÉFONO:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-24 uppercase text-[9px] text-slate-600 font-bold tracking-wider">DIRECCIÓN (ENVÍO):</span>
                            <span className="font-medium text-slate-900 truncate border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.address}</span>
                          </div>
                          <div className="flex items-center">
                            <Tag className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-24 uppercase text-[9px] text-slate-600 font-bold tracking-wider">REFERENCIA:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.reference}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Badge Card (4 cols) */}
                      <div className="col-span-12 sm:col-span-4 flex flex-col">
                        <div className="bg-[#E4DFD7] p-2.5 flex flex-col items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <MotorbikeIconSvg className="w-5 h-5 text-[#161716]" />
                            <span className="font-bold text-[10px] text-[#161716] uppercase tracking-wider">ENVÍO: LIMA</span>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F5] p-3 border border-t-0 border-[#E4DFD7] space-y-3 flex-1">
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">MODO DE ENVÍO</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">Motorizado</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ADELANTO:</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">S/ {generatedReceipt.adelanto.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">SALDO:</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">{generatedReceipt.saldoTexto}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left text-[10px] border-collapse border border-[#A59B8F]">
                      <thead>
                        <tr className="bg-[#A59B8F] text-[#161716] font-bold uppercase tracking-wider">
                          <th className="py-2 px-2 text-center border border-[#A59B8F] w-12">CANT.</th>
                          <th className="py-2 px-3 border border-[#A59B8F]">PRODUCTO</th>
                          <th className="py-2 px-2 text-center border border-[#A59B8F]">MATERIAL</th>
                          <th className="py-2 px-2 text-center border border-[#A59B8F]">PRECIO UNIT.</th>
                          <th className="py-2 px-3 text-center border border-[#A59B8F]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-slate-800">
                        {generatedReceipt.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">{item.quantity}</td>
                            <td className="py-2 px-3 font-medium border border-[#A59B8F]">{item.productName}</td>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">{item.material || 'Plata 950'}</td>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">S/ {item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center font-medium border border-[#A59B8F]">S/ {item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - generatedReceipt.items.length) }).map((_, i) => (
                          <tr key={\`blank-\${i}\`} className="h-7">
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Observations & Total Box */}
                    <div className="grid grid-cols-12 gap-4 text-xs">
                      <div className="col-span-7 flex flex-col border border-[#E4DFD7] bg-[#F8F7F5]">
                        <div className="px-3 pt-2 font-bold text-[9px] text-slate-800 uppercase tracking-widest">
                          OBSERVACIONES
                        </div>
                        <div className="px-3 pb-2 pt-1 text-[10px] text-slate-700 flex-1 leading-relaxed">
                          Entrega estimada: El mismo día (máx. 24 horas).
                        </div>
                      </div>

                      <div className="col-span-5 flex flex-col border border-[#E4DFD7]">
                        <div className="bg-[#E4DFD7] px-3 py-1.5 font-bold text-[10px] text-[#161716] text-center uppercase tracking-wider">
                          TOTAL A PAGAR
                        </div>
                        <div className="p-2 text-center bg-[#F8F7F5] flex-1 flex items-center justify-center">
                          <span className="font-bold text-xl text-[#161716]">
                            S/ {generatedReceipt.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thank You Banner */}
                    <div className="bg-[#E4DFD7] py-2 text-center font-bold text-[11px] text-[#161716] tracking-[0.2em]">
                      ¡GRACIAS POR TU COMPRA!
                    </div>

                    {/* Contact Social Bar */}
                    <div className="flex items-center justify-between text-[10px] text-[#161716] px-6 py-3 bg-[#F8F7F5] border border-[#E4DFD7]">
                      <span className="flex items-center space-x-2">
                        <Instagram className="w-4 h-4" />
                        <span className="font-medium">obsidiana.joyeria</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">987 654 321</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Lima, Perú</span>
                      </span>
                    </div>

                    {/* Scissor Cut Tear-Off Voucher Stub */}
                    <div className="pt-2 space-y-4">
                      <div className="flex items-center space-x-3 text-[#161716] text-[10px]">
                        <Scissors className="w-5 h-5 shrink-0" />
                        <div className="border-b border-dashed border-[#161716] flex-1"></div>
                      </div>

                      <div className="grid grid-cols-12 gap-0 bg-[#F8F7F5] border border-[#E4DFD7] items-stretch">
                        
                        {/* Logo Box */}
                        <div className="col-span-3 flex flex-col items-center justify-center text-center p-3 border-r border-[#E4DFD7]">
                          <img src="/assets/Icono/icono-negro.jpeg" className="w-12 h-12 rounded-full border border-[#E4DFD7]" />
                          <p className="font-serif font-medium text-sm text-[#161716] uppercase mt-2">OBSIDIANA</p>
                          <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">NOTA DE VENTA</p>
                          <div className="bg-[#E4DFD7] text-[#161716] font-bold text-[9px] px-2 py-0.5 w-full mt-1.5">
                            N° {generatedReceipt.receiptNumber}
                          </div>
                          <p className="text-[7px] text-slate-500 font-medium mt-1">FECHA: {generatedReceipt.date}</p>
                        </div>

                        {/* Middle Details */}
                        <div className="col-span-6 flex flex-col justify-center space-y-2 text-[9px] text-slate-800 p-3">
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">NOMBRE:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5 truncate">{generatedReceipt.customer.name}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">TOTAL:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">S/ {generatedReceipt.total.toFixed(2)}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">ADELANTO:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">S/ {generatedReceipt.adelanto.toFixed(2)}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">SALDO:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">{generatedReceipt.saldoTexto}</span>
                          </div>
                        </div>

                        {/* Right Moto Icon */}
                        <div className="col-span-3 flex flex-col items-center justify-center bg-[#E4DFD7] p-3 text-center">
                          <MotorbikeIconSvg className="w-7 h-7 text-[#161716]" />
                          <span className="font-bold text-[8px] text-[#161716] uppercase mt-2 leading-snug tracking-wider">LIMA<br/>MOTORIZADO</span>
                        </div>
                      </div>

                      <p className="text-[9px] text-center text-slate-500 font-medium pb-1">
                        Conserva este comprobante como constancia de tu compra.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* VARIANT 2: NOTA DE VENTA PROVINCIA (EXACT MATCH TO MOCKUP 2) */}
              {(receiptTab === 'provincia') && (
                <div className="max-w-2xl mx-auto border border-[#61564A] bg-white text-slate-900 overflow-hidden font-sans shadow-sm mb-4">
                  
                  {/* Top Black Header */}
                  <div className="bg-[#161716] text-[#E4DFD7] p-4 sm:p-5 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img src="/assets/Icono/icono-blanco.jpeg" alt="Obsidiana Logo" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border border-[#61564A]" />
                      <div>
                        <h1 className="font-serif font-medium text-2xl sm:text-4xl tracking-widest uppercase leading-none">
                          OBSIDIANA
                        </h1>
                        <p className="text-[8px] sm:text-[10px] font-medium text-[#A59B8F] uppercase tracking-[0.25em] mt-1.5 ml-0.5">
                          JOYERÍA EN PLATA 925/950
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end space-y-1">
                      <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white mb-1">NOTA DE VENTA</p>
                      <div className="bg-white text-[#161716] font-bold font-mono text-[10px] sm:text-xs px-3 py-1 w-32 sm:w-40 text-center">
                        N° {generatedReceipt.receiptNumber}
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-[#A59B8F] mt-1">FECHA: {generatedReceipt.date}</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-5">
                    {/* DATOS DEL CLIENTE Box Grid */}
                    <div className="grid grid-cols-12 gap-4 text-xs">
                      {/* Left Details (8 cols) */}
                      <div className="col-span-12 sm:col-span-8 flex flex-col">
                        <div className="bg-[#E4DFD7] px-3 py-1.5 font-bold text-[10px] text-[#161716] uppercase tracking-widest">
                          DATOS DEL CLIENTE
                        </div>
                        <div className="border border-t-0 border-[#E4DFD7] p-3 space-y-2.5 flex-1 bg-white">
                          <div className="flex items-center">
                            <User className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">NOMBRE:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.name}</span>
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">DNI / RUC:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.doc}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">TELÉFONO:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">CIUDAD / PROVINCIA:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.province} - {generatedReceipt.customer.district}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">DIRECCIÓN:</span>
                            <span className="font-medium text-slate-900 truncate border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.address}</span>
                          </div>
                          <div className="flex items-center">
                            <Tag className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                            <span className="w-28 uppercase text-[9px] text-slate-600 font-bold tracking-wider">REFERENCIA:</span>
                            <span className="font-medium text-slate-900 border-b border-slate-200 flex-1 pb-0.5 px-1">{generatedReceipt.customer.reference}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Badge Card (4 cols) */}
                      <div className="col-span-12 sm:col-span-4 flex flex-col">
                        <div className="bg-[#E4DFD7] p-2.5 flex flex-col items-center justify-center">
                          <div className="flex items-center space-x-2">
                            <PackageBoxIconSvg className="w-5 h-5 text-[#161716]" />
                            <span className="font-bold text-[10px] text-[#161716] uppercase tracking-wider">ENVÍO: PROVINCIA</span>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F5] p-3 border border-t-0 border-[#E4DFD7] space-y-3 flex-1">
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">VÍA DE ENVÍO</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">Agencia de Transporte</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ADELANTO:</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">S/ {generatedReceipt.adelanto.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">SALDO:</p>
                            <p className="font-medium text-slate-900 text-[11px] border-b border-[#E4DFD7] pb-1">{generatedReceipt.saldoTexto}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left text-[10px] border-collapse border border-[#A59B8F]">
                      <thead>
                        <tr className="bg-[#A59B8F] text-[#161716] font-bold uppercase tracking-wider">
                          <th className="py-2 px-2 text-center border border-[#A59B8F] w-12">CANT.</th>
                          <th className="py-2 px-3 border border-[#A59B8F]">PRODUCTO</th>
                          <th className="py-2 px-2 text-center border border-[#A59B8F]">MATERIAL</th>
                          <th className="py-2 px-2 text-center border border-[#A59B8F]">PRECIO UNIT.</th>
                          <th className="py-2 px-3 text-center border border-[#A59B8F]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-slate-800">
                        {generatedReceipt.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">{item.quantity}</td>
                            <td className="py-2 px-3 font-medium border border-[#A59B8F]">{item.productName}</td>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">{item.material || 'Plata 950'}</td>
                            <td className="py-2 px-2 text-center font-medium border border-[#A59B8F]">S/ {item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center font-medium border border-[#A59B8F]">S/ {item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - generatedReceipt.items.length) }).map((_, i) => (
                          <tr key={\`blank-\${i}\`} className="h-7">
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                            <td className="border border-[#A59B8F]"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Observations & Total Box */}
                    <div className="grid grid-cols-12 gap-4 text-xs">
                      <div className="col-span-7 flex flex-col border border-[#E4DFD7] bg-[#F8F7F5]">
                        <div className="px-3 pt-2 font-bold text-[9px] text-slate-800 uppercase tracking-widest">
                          OBSERVACIONES
                        </div>
                        <div className="px-3 pb-2 pt-1 text-[10px] text-slate-700 flex-1 leading-relaxed">
                          Despacho vía Shalom / Olva Courier.<br/>El saldo se cancela al llegar a la agencia.
                        </div>
                      </div>

                      <div className="col-span-5 flex flex-col border border-[#E4DFD7]">
                        <div className="bg-[#E4DFD7] px-3 py-1.5 font-bold text-[10px] text-[#161716] text-center uppercase tracking-wider">
                          TOTAL A PAGAR
                        </div>
                        <div className="p-2 text-center bg-[#F8F7F5] flex-1 flex items-center justify-center">
                          <span className="font-bold text-xl text-[#161716]">
                            S/ {generatedReceipt.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thank You Banner */}
                    <div className="bg-[#E4DFD7] py-2 text-center font-bold text-[11px] text-[#161716] tracking-[0.2em]">
                      ¡GRACIAS POR TU COMPRA!
                    </div>

                    {/* Contact Social Bar */}
                    <div className="flex items-center justify-between text-[10px] text-[#161716] px-6 py-3 bg-[#F8F7F5] border border-[#E4DFD7]">
                      <span className="flex items-center space-x-2">
                        <Instagram className="w-4 h-4" />
                        <span className="font-medium">obsidiana.joyeria</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">987 654 321</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Lima, Perú</span>
                      </span>
                    </div>

                    {/* Scissor Cut Tear-Off Voucher Stub */}
                    <div className="pt-2 space-y-4">
                      <div className="flex items-center space-x-3 text-[#161716] text-[10px]">
                        <Scissors className="w-5 h-5 shrink-0" />
                        <div className="border-b border-dashed border-[#161716] flex-1"></div>
                      </div>

                      <div className="grid grid-cols-12 gap-0 bg-[#F8F7F5] border border-[#E4DFD7] items-stretch">
                        
                        {/* Logo Box */}
                        <div className="col-span-3 flex flex-col items-center justify-center text-center p-3 border-r border-[#E4DFD7]">
                          <img src="/assets/Icono/icono-negro.jpeg" className="w-12 h-12 rounded-full border border-[#E4DFD7]" />
                          <p className="font-serif font-medium text-sm text-[#161716] uppercase mt-2">OBSIDIANA</p>
                          <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">NOTA DE VENTA</p>
                          <div className="bg-[#E4DFD7] text-[#161716] font-bold text-[9px] px-2 py-0.5 w-full mt-1.5">
                            N° {generatedReceipt.receiptNumber}
                          </div>
                          <p className="text-[7px] text-slate-500 font-medium mt-1">FECHA: {generatedReceipt.date}</p>
                        </div>

                        {/* Middle Details */}
                        <div className="col-span-6 flex flex-col justify-center space-y-2 text-[9px] text-slate-800 p-3">
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">NOMBRE:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5 truncate">{generatedReceipt.customer.name}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">TOTAL:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">S/ {generatedReceipt.total.toFixed(2)}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">ADELANTO:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">S/ {generatedReceipt.adelanto.toFixed(2)}</span>
                          </div>
                          <div className="flex items-end space-x-2">
                            <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider w-14">SALDO:</span>
                            <span className="font-medium border-b border-[#E4DFD7] flex-1 pb-0.5">{generatedReceipt.saldoTexto}</span>
                          </div>
                        </div>

                        {/* Right Moto Icon */}
                        <div className="col-span-3 flex flex-col items-center justify-center bg-[#E4DFD7] p-3 text-center">
                          <PackageBoxIconSvg className="w-7 h-7 text-[#161716]" />
                          <span className="font-bold text-[8px] text-[#161716] uppercase mt-2 leading-snug tracking-wider">PROVINCIA<br/>AGENCIA</span>
                        </div>
                      </div>

                      <p className="text-[9px] text-center text-slate-500 font-medium pb-1">
                        Conserva este comprobante como constancia de tu compra.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* VARIANT 3: REGISTRO DE VENTA - CLIENTES (FRENTE) */}
              {receiptTab === 'cliente_frente' && (
                <div className="max-w-md mx-auto border border-slate-300 bg-white text-slate-900 font-sans shadow-sm mb-4">
                  
                  {/* Top Banner Header */}
                  <div className="bg-[#E4DFD7] px-4 py-2 text-center">
                    <p className="font-bold text-[9px] text-slate-800 tracking-widest uppercase">REGISTRO DE VENTA - CLIENTES</p>
                  </div>
                  <div className="bg-white py-1 text-center">
                    <p className="font-bold text-[8px] text-slate-500 tracking-widest uppercase">FRENTE</p>
                  </div>

                  <div className="bg-[#161716] text-[#E4DFD7] p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src="/assets/Icono/icono-blanco.jpeg" alt="Logo" className="w-8 h-8 rounded-full border border-white" />
                      <span className="font-serif font-medium text-xl tracking-widest uppercase">OBSIDIANA</span>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white border-b border-white pb-0.5">
                      REGISTRO DE CLIENTE
                    </span>
                  </div>

                  {/* Form Lines */}
                  <div className="p-6 space-y-5 text-xs text-slate-800">
                    <div className="flex items-end space-x-2">
                      <User className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">NOMBRE COMPLETO:</span>
                      <span className="border-b border-slate-300 flex-1 font-medium px-1 pb-1">{generatedReceipt.customer.name}</span>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6 flex items-end space-x-2">
                        <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">DNI:</span>
                        <span className="border-b border-slate-300 flex-1 px-1 pb-1">{generatedReceipt.customer.doc}</span>
                      </div>
                      <div className="col-span-6 flex items-end space-x-2">
                        <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0 ml-4">FECHA NAC.:</span>
                        <span className="border-b border-slate-300 flex-1 text-center pb-1 text-[10px]">___ / ___ / ______</span>
                      </div>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">TELÉFONO:</span>
                      <span className="border-b border-slate-300 flex-1 px-1 pb-1">{generatedReceipt.customer.phone}</span>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">CORREO ELECTRÓNICO:</span>
                      <span className="border-b border-slate-300 flex-1 px-1 pb-1">{generatedReceipt.customer.email}</span>
                    </div>

                    <div className="flex items-end space-x-2">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">DIRECCIÓN:</span>
                      <span className="border-b border-slate-300 flex-1 px-1 pb-1 truncate">{generatedReceipt.customer.address}</span>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Building className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">CIUDAD / PROVINCIA:</span>
                      <span className="border-b border-slate-300 flex-1 px-1 pb-1">{generatedReceipt.customer.province}</span>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="uppercase text-[9px] font-bold text-slate-600 shrink-0">¿CÓMO NOS CONOCISTE?</span>
                      <span className="border-b border-slate-300 flex-1 px-1 pb-1 text-[10px]">Instagram / TikTok / Recomendación</span>
                    </div>
                  </div>

                  {/* Bottom Beige Message Box */}
                  <div className="bg-[#E4DFD7] p-8 text-center space-y-2 mt-4">
                    <p className="font-serif italic font-medium text-slate-800 text-xl flex items-center justify-center space-x-2">
                      <Heart className="w-4 h-4 text-[#161716] fill-transparent stroke-[1.5]" />
                      <span>Gracias por elegir Obsidiana</span>
                    </p>
                    <p className="text-[10px] text-slate-700 font-medium">
                      Tu estilo, nuestra esencia.
                    </p>
                  </div>

                </div>
              )}

              {/* VARIANT 4: REGISTRO DE VENTA - CLIENTES (REVERSO COMPRAS) */}
              {receiptTab === 'cliente_reverso' && (
                <div className="max-w-md mx-auto border border-[#E4DFD7] bg-white text-slate-900 font-sans shadow-sm mb-4 flex flex-col min-h-[500px]">
                  
                  {/* Taupe Header Bar */}
                  <div className="bg-[#A59B8F] text-[#161716] px-4 py-3 text-center">
                    <span className="font-bold text-[10px] uppercase tracking-widest">
                      REGISTRO DE COMPRAS
                    </span>
                  </div>

                  {/* History Table */}
                  <div className="p-4 flex-1">
                    <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="text-slate-600 font-bold uppercase tracking-wider">
                          <th className="p-1.5 border border-slate-300 text-center w-14">FECHA</th>
                          <th className="p-1.5 border border-slate-300 text-center w-16">N° NOTA</th>
                          <th className="p-1.5 border border-slate-300">PRODUCTOS</th>
                          <th className="p-1.5 border border-slate-300 text-center w-12">TOTAL</th>
                          <th className="p-1.5 border border-slate-300 text-center w-14">ADELANTO</th>
                          <th className="p-1.5 border border-slate-300 text-center w-12">SALDO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-1.5 border border-slate-300 text-center">{generatedReceipt.date}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-medium">{generatedReceipt.receiptNumber}</td>
                          <td className="p-1.5 border border-slate-300 font-medium truncate max-w-[80px]">{generatedReceipt.items[0]?.productName || ''}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-medium">{generatedReceipt.total.toFixed(2)}</td>
                          <td className="p-1.5 border border-slate-300 text-center">{generatedReceipt.adelanto.toFixed(2)}</td>
                          <td className="p-1.5 border border-slate-300 text-center">{generatedReceipt.saldo.toFixed(2)}</td>
                        </tr>

                        {/* Blank Rows */}
                        {Array.from({ length: 12 }).map((_, i) => (
                          <tr key={i} className="h-6">
                            <td className="border border-slate-300"></td>
                            <td className="border border-slate-300"></td>
                            <td className="border border-slate-300"></td>
                            <td className="border border-slate-300"></td>
                            <td className="border border-slate-300"></td>
                            <td className="border border-slate-300"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Observations & Contact */}
                  <div className="px-4 pb-4 grid grid-cols-12 gap-3 text-[9px]">
                    <div className="col-span-7 border border-slate-300 p-2 space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-widest text-[8px]">OBSERVACIONES</p>
                      <div className="border-b border-slate-200 h-4"></div>
                      <div className="border-b border-slate-200 h-4"></div>
                      <div className="border-b border-slate-200 h-4"></div>
                    </div>

                    <div className="col-span-5 bg-slate-50 border border-slate-300 p-3 flex flex-col justify-center space-y-2 text-slate-700">
                      <p className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">987 654 321</span>
                      </p>
                      <p className="flex items-center space-x-1.5">
                        <Instagram className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">obsidiana.joyeria</span>
                      </p>
                      <p className="flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">Lima, Perú</span>
                      </span>
                    </div>
                  </div>

                  {/* Black Footer Tag */}
                  <div className="bg-[#161716] text-[#E4DFD7] py-2 flex items-center justify-center space-x-2 text-[8px] font-bold tracking-[0.2em] uppercase">
                    <Gem className="w-3 h-3 text-[#A59B8F]" />
                    <span>PLATA 925 / 950 · AUTÉNTICA · GARANTIZADA</span>
                  </div>

                </div>
              )}
`;

const startIndex = content.indexOf("{/* VARIANT 1: NOTA DE VENTA LIMA (EXACT MATCH TO MOCKUP 1) */}");
const endIndex = content.indexOf("{/* Modal Actions */}");

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(targetFile, newContent, 'utf8');
  console.log("Templates updated successfully!");
} else {
  console.log("Could not find start or end index.");
}
