const fs = require('fs');

const filePath = 'D:\\obs-store\\src\\components\\PosModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const AGENCY_BRANCHES = `
// Agency branch data
const AGENCY_BRANCHES: Record<string, { city: string; address: string }[]> = {
  Shalom: [
    { city: 'Lima', address: 'Av. Argentina 2302, Lima Cercado' },
    { city: 'Arequipa', address: 'Av. Ejército 212, Miraflores' },
    { city: 'Cusco', address: 'Av. De La Cultura 1318' },
    { city: 'Trujillo', address: 'Jr. Junín 508, Centro' },
    { city: 'Piura', address: 'Av. Loreto 560, Piura Centro' },
    { city: 'Chiclayo', address: 'Av. Balta 786, Chiclayo Centro' },
    { city: 'Iquitos', address: 'Av. La Marina 1040' },
    { city: 'Puno', address: 'Jr. Moquegua 346' },
    { city: 'Huancayo', address: 'Av. Giráldez 401' },
    { city: 'Cajamarca', address: 'Jr. El Comercio 860' },
  ],
  Olva: [
    { city: 'Lima', address: 'Av. Petit Thouars 2673, Lince' },
    { city: 'Arequipa', address: 'Calle Mercaderes 420, Arequipa Centro' },
    { city: 'Cusco', address: 'Av. El Sol 928' },
    { city: 'Trujillo', address: 'Jr. Pizarro 422' },
    { city: 'Piura', address: 'Jr. Tacna 890, Piura' },
    { city: 'Chiclayo', address: 'Av. Vicente de la Vega 102' },
    { city: 'Iquitos', address: 'Jr. Putumayo 200' },
    { city: 'Puno', address: 'Jr. Lima 504' },
    { city: 'Huancayo', address: 'Jr. Cusco 108' },
    { city: 'Cajamarca', address: 'Jr. Cruz de Piedra 506' },
  ],
  Marvisure: [
    { city: 'Lima', address: 'Av. 28 de Julio 1044, La Victoria' },
    { city: 'Arequipa', address: 'Av. Mariscal Castilla 102' },
    { city: 'Cusco', address: 'Av. Pardo 895' },
    { city: 'Trujillo', address: 'Av. España 1100' },
    { city: 'Piura', address: 'Av. Grau 345, Piura' },
    { city: 'Chiclayo', address: 'Calle 7 de Enero 560' },
    { city: 'Iquitos', address: 'Av. Quiñones 780' },
    { city: 'Puno', address: 'Jr. Oquendo 240' },
    { city: 'Huancayo', address: 'Av. Ferrocarril 336' },
    { city: 'Cajamarca', address: 'Av. Héroes del Cenepa 220' },
  ],
};

`;

// Find where the PosModule component function starts, just before the first useState
// We'll insert our constant just before the component function
const componentStart = content.indexOf('const PosModule');
if (componentStart !== -1) {
  content = content.slice(0, componentStart) + AGENCY_BRANCHES + content.slice(componentStart);
  console.log('Inserted AGENCY_BRANCHES constant before PosModule.');
} else {
  console.log('ERROR: Could not find PosModule component.');
  process.exit(1);
}

// Now add agencyBranch state variable after the shippingAgency state
const shippingAgencyState = `  const [shippingAgency, setShippingAgency] = useState<string>('Motorizado');`;
const newShippingAgencyState = `  const [shippingAgency, setShippingAgency] = useState<string>('Motorizado');
  const [selectedAgencyBranch, setSelectedAgencyBranch] = useState<string>('');`;

content = content.replace(shippingAgencyState, newShippingAgencyState);
console.log('Added selectedAgencyBranch state.');

// Now replace the entire TAB CONTENT 1 section (cliente_envio tab)
const OLD_FORM_START = `                {/* Delivery Pills */}
                <div className="pt-1 border-t border-slate-100 space-y-1">
                  <span className="text-[8px] font-bold text-slate-500 uppercase block">Modalidad de Envío</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('express');
                        setSelectedProvince('Lima');
                        setShippingAgency('Motorizado');
                      }}
                      className={\`py-1 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all \${
                        deliveryType === 'express' ? 'bg-[#61564A] text-white border-[#61564A]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }\`}
                    >
                      🛵 Lima (S/10)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('provincia');
                        if (selectedProvince === 'Lima') setSelectedProvince('Cusco');
                        if (!['Shalom','Olva','Marvisure'].includes(shippingAgency)) setShippingAgency('Shalom');
                      }}
                      className={\`py-1 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all \${
                        deliveryType === 'provincia' ? 'bg-[#61564A] text-white border-[#61564A]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }\`}
                    >
                      📦 Prov (S/18)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('tienda');
                        setSelectedProvince('Lima');
                        setShippingAgency('Recojo en Tienda');
                      }}
                      className={\`py-1 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all \${
                        deliveryType === 'tienda' ? 'bg-[#61564A] text-white border-[#61564A]' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }\`}
                    >
                      🏬 Tienda (S/0)
                    </button>
                  </div>

                  {/* Agency selector – only shown for Provincia */}
                  {deliveryType === 'provincia' && (
                    <div className="pt-1">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Agencia de Envío</span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['Shalom', 'Olva', 'Marvisure'] as const).map((agency) => (
                          <button
                            key={agency}
                            type="button"
                            onClick={() => setShippingAgency(agency)}
                            className={\`py-1 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all \${
                              shippingAgency === agency
                                ? 'bg-[#61564A] text-white border-[#61564A]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#61564A]'
                            }\`}
                          >
                            {agency === 'Shalom' ? '🟡' : agency === 'Olva' ? '🔵' : '🟠'} {agency}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Inputs */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase block">Ciudad/Provincia</label>
                    <input
                      type="text"
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      placeholder="Lima, Cusco..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase block">Distrito</label>
                    <input
                      type="text"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      placeholder="Lince, Wanchaq..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase block">Dirección</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Av. Arequipa 1234..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase block">Referencia</label>
                    <input
                      type="text"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                      placeholder="Alt. Cdra 12"
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Coordenadas GPS Input Field */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[8px] font-bold text-slate-600 uppercase flex items-center space-x-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-600" />
                      <span>Coordenadas GPS / Google Maps</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="text-[9px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>🗺️ Buscar en Mapa</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={customerCoords ? \`\${customerCoords.lat.toFixed(6)}, \${customerCoords.lng.toFixed(6)}\` : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const coordsRegex = /(-?\\d{1,2}\\.\\d+)\\s*[\\s,;:\\/]\\s*(-?\\d{1,3}\\.\\d+)/;
                        const match = val.match(coordsRegex);
                        if (match) {
                          const lat = parseFloat(match[1]);
                          const lng = parseFloat(match[2]);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            setCustomerCoords({ lat, lng });
                          }
                        } else if (!val.trim()) {
                          setCustomerCoords(null);
                        }
                      }}
                      placeholder="Pegar ej: -12.0894, -77.0335 o link Maps"
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                    {customerCoords && (
                      <a
                        href={\`https://www.google.com/maps?q=\${customerCoords.lat},\${customerCoords.lng}\`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-blue-600 hover:underline font-bold shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                      >
                        Maps ↗
                      </a>
                    )}
                  </div>
                </div>`;

const NEW_FORM = `                {/* ── ENVÍO ── */}
                <div className="border border-slate-100 rounded-xl bg-slate-50/60 p-2.5 space-y-2.5">
                  <p className="text-[9px] font-black text-[#61564A] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#61564A] flex items-center justify-center text-white text-[7px]">✈</span>
                    Modalidad de Envío
                  </p>

                  {/* Mode selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: 'express', label: 'Lima', icon: '🛵', sub: 'S/10', onClick: () => { setDeliveryType('express'); setSelectedProvince('Lima'); setShippingAgency('Motorizado'); setSelectedAgencyBranch(''); } },
                      { id: 'provincia', label: 'Provincia', icon: '📦', sub: 'S/18', onClick: () => { setDeliveryType('provincia'); if (selectedProvince === 'Lima') setSelectedProvince('Cusco'); if (!['Shalom','Olva','Marvisure'].includes(shippingAgency)) { setShippingAgency('Shalom'); setSelectedAgencyBranch(''); } } },
                      { id: 'tienda', label: 'Tienda', icon: '🏬', sub: 'S/0', onClick: () => { setDeliveryType('tienda'); setSelectedProvince('Lima'); setShippingAgency('Recojo en Tienda'); setSelectedAgencyBranch(''); } },
                    ] as const).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={mode.onClick}
                        className={\`py-1.5 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all flex flex-col items-center gap-0.5 \${
                          deliveryType === mode.id ? 'bg-[#61564A] text-white border-[#61564A] shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-[#61564A]/50'
                        }\`}
                      >
                        <span className="text-sm">{mode.icon}</span>
                        <span>{mode.label}</span>
                        <span className={\`text-[8px] \${deliveryType === mode.id ? 'text-[#E4DFD7]' : 'text-slate-400'}\`}>{mode.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Provincia: agency + branch */}
                  {deliveryType === 'provincia' && (
                    <div className="space-y-2 animate-fadeIn">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Agencia de Envío</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Shalom', 'Olva', 'Marvisure'] as const).map((agency) => (
                          <button
                            key={agency}
                            type="button"
                            onClick={() => { setShippingAgency(agency); setSelectedAgencyBranch(''); }}
                            className={\`py-1.5 px-1 rounded-lg text-center border text-[9px] font-bold cursor-pointer transition-all flex flex-col items-center gap-0.5 \${
                              shippingAgency === agency
                                ? 'bg-[#61564A] text-white border-[#61564A] shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-[#61564A]/50'
                            }\`}
                          >
                            <span className="text-sm">{agency === 'Shalom' ? '🟡' : agency === 'Olva' ? '🔵' : '🟠'}</span>
                            <span>{agency}</span>
                          </button>
                        ))}
                      </div>

                      {/* Branch / Sede selector */}
                      {['Shalom', 'Olva', 'Marvisure'].includes(shippingAgency) && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sede de Destino</p>
                          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-0.5">
                            {(AGENCY_BRANCHES[shippingAgency] ?? []).map((branch) => (
                              <button
                                key={branch.city}
                                type="button"
                                onClick={() => {
                                  setSelectedAgencyBranch(\`\${shippingAgency} \${branch.city} – \${branch.address}\`);
                                  setSelectedProvince(branch.city);
                                }}
                                className={\`w-full text-left px-2 py-1.5 rounded-lg border text-[9px] cursor-pointer transition-all flex items-start gap-2 \${
                                  selectedAgencyBranch.startsWith(\`\${shippingAgency} \${branch.city}\`)
                                    ? 'bg-[#E4DFD7] border-[#61564A] text-[#161716] font-bold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#A59B8F]'
                                }\`}
                              >
                                <span className="text-xs mt-0.5">📍</span>
                                <div>
                                  <span className="font-bold block">{branch.city}</span>
                                  <span className="text-[8px] text-slate-500 leading-tight block">{branch.address}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                          {selectedAgencyBranch && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 text-[9px] text-emerald-700 font-medium flex items-center gap-1">
                              <span>✅</span>
                              <span>{selectedAgencyBranch}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lima: address + GPS */}
                  {deliveryType === 'express' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Distrito</label>
                          <input type="text" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} placeholder="Lince, Miraflores…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Referencia</label>
                          <input type="text" value={customerReference} onChange={(e) => setCustomerReference(e.target.value)} placeholder="Alt. Cdra. 12" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Dirección de Entrega</label>
                        <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Av. Arequipa 1234, Lince…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                      </div>

                      {/* GPS */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[8px] font-bold text-amber-700 uppercase flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            Ubicación GPS
                          </label>
                          <button type="button" onClick={() => setIsMapModalOpen(true)} className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
                            🗺️ Abrir Mapa
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={customerCoords ? \`\${customerCoords.lat.toFixed(6)}, \${customerCoords.lng.toFixed(6)}\` : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const match = val.match(/(-?\\d{1,2}\\.\\d+)[\\s,;:\\/]+(-?\\d{1,3}\\.\\d+)/);
                              if (match) { const lat = parseFloat(match[1]); const lng = parseFloat(match[2]); if (!isNaN(lat) && !isNaN(lng)) setCustomerCoords({ lat, lng }); }
                              else if (!val.trim()) setCustomerCoords(null);
                            }}
                            placeholder="-12.0894, -77.0335"
                            className="w-full bg-white border border-amber-200 rounded-md px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
                          />
                          {customerCoords && (
                            <a href={\`https://www.google.com/maps?q=\${customerCoords.lat},\${customerCoords.lng}\`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md hover:bg-blue-100">
                              ↗
                            </a>
                          )}
                        </div>
                        {customerCoords && <p className="text-[8px] text-emerald-600 font-medium">✅ Coordenadas capturadas</p>}
                      </div>
                    </div>
                  )}

                  {/* Provincia: city + address */}
                  {deliveryType === 'provincia' && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Ciudad / Provincia</label>
                          <input type="text" value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} placeholder="Cusco, Arequipa…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Distrito</label>
                          <input type="text" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} placeholder="Wanchaq, Cayma…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Dirección del Cliente</label>
                        <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Urb. Santa Mónica B-4…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Referencia</label>
                        <input type="text" value={customerReference} onChange={(e) => setCustomerReference(e.target.value)} placeholder="Frente al parque…" className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]" />
                      </div>
                    </div>
                  )}

                  {/* Tienda: just reference */}
                  {deliveryType === 'tienda' && (
                    <div className="animate-fadeIn">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-[10px] text-slate-600 font-medium text-center">
                        🏬 El cliente recoge en tienda. No se necesitan datos de dirección.
                      </div>
                    </div>
                  )}
                </div>`;

if (content.includes(OLD_FORM_START)) {
  content = content.replace(OLD_FORM_START, NEW_FORM);
  console.log('Form replaced successfully!');
} else {
  console.log('ERROR: Could not find old form section. Trying partial match...');
  // debug
  const idx = content.indexOf('/* Delivery Pills */');
  if (idx !== -1) {
    console.log('Found "Delivery Pills" at index', idx);
    console.log('Chars around it:', JSON.stringify(content.substring(idx, idx + 200)));
  } else {
    console.log('Could not even find /* Delivery Pills */');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File saved.');
