const fs = require('fs');
const filePath = 'D:\\obs-store\\src\\components\\PosModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Olva and Marvisure from the AGENCY_BRANCHES constant
const oldBranches = /\/\/ Agency branch data\nconst AGENCY_BRANCHES[\s\S]*?^};\n\n/m;
content = content.replace(/\/\/ Agency branch data\r?\nconst AGENCY_BRANCHES: Record<string, \{ city: string; address: string \}\[\]> = \{[\s\S]*?\};\r?\n\r?\n/, '');

// 2. Replace the 3-button agency selector (Shalom/Olva/Marvisure) with just Shalom
const oldAgencySelector = `                  {/* Provincia: agency + branch */}
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
                      </div>`;

const newAgencySelector = `                  {/* Provincia: Shalom agency */}
                  {deliveryType === 'provincia' && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-base">🟡</span>
                        <div>
                          <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Agencia Shalom</p>
                          <p className="text-[8px] text-amber-600">475 sedes en todo el Perú</p>
                        </div>
                      </div>`;

if (content.includes(oldAgencySelector)) {
  content = content.replace(oldAgencySelector, newAgencySelector);
  console.log('✅ Agency selector simplified to Shalom only');
} else {
  console.log('⚠️  Agency selector pattern not found - trying alternate approach');
}

// 3. Remove Olva/Marvisure branch block, keep only Shalom buscador
// The current code has: shippingAgency === 'Shalom' ? <ShalomBuscador> : (<Olva/Marvisure block>)
// We want to replace the whole conditional with just <ShalomBuscador>
const oldBranchBlock = `                      {/* Branch / Sede selector */}
                      {['Shalom', 'Olva', 'Marvisure'].includes(shippingAgency) && (
                        <div>
                          {shippingAgency === 'Shalom' ? (
                            <ShalomBuscador
                              selectedNombre={selectedAgencyBranch}
                              onSelect={(a: AgenciaShalom) => {
                                if (!a.nombre) {
                                  setSelectedAgencyBranch('');
                                  setSelectedProvince('');
                                  return;
                                }
                                setSelectedAgencyBranch(\`\${a.nombre} – \${a.departamento} › \${a.provincia} › \${a.distrito}\`);
                                setSelectedProvince(a.provincia);
                                setSelectedDistrict(a.distrito);
                              }}
                            />
                          ) : (
                            // Olva / Marvisure: city chips + free text + link
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ciudad de Destino</p>
                                <a
                                  href={shippingAgency === 'Olva' ? 'https://www.olvacourier.com/ubicanos' : 'https://www.expresomarvisur.com'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[8px] font-bold text-blue-600 hover:underline"
                                >
                                  🔍 Ver sedes oficiales ↗
                                </a>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {['Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Chiclayo', 'Iquitos', 'Puno', 'Huancayo', 'Cajamarca', 'Tacna', 'Ica', 'Ayacucho', 'Huánuco', 'Juliaca', 'Tarapoto'].map((city) => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => { setSelectedProvince(city); setSelectedAgencyBranch(\`\${shippingAgency} – \${city}\`); }}
                                    className={\`px-2 py-0.5 rounded-full border text-[8px] font-bold cursor-pointer transition-all \${
                                      selectedProvince === city ? 'bg-[#61564A] text-white border-[#61564A]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#61564A]/60'
                                    }\`}
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={selectedProvince}
                                onChange={(e) => { setSelectedProvince(e.target.value); setSelectedAgencyBranch(e.target.value ? \`\${shippingAgency} – \${e.target.value}\` : ''); }}
                                placeholder="O escribe la ciudad aquí…"
                                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#61564A]"
                              />
                              {selectedAgencyBranch && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 text-[9px] text-emerald-700 font-medium flex items-center gap-1">
                                  <span>✅</span>
                                  <span>Enviando vía <strong>{selectedAgencyBranch}</strong></span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}`;

const newBranchBlock = `                      {/* Sede Shalom buscador */}
                      <ShalomBuscador
                        selectedNombre={selectedAgencyBranch}
                        onSelect={(a: AgenciaShalom) => {
                          if (!a.nombre) {
                            setSelectedAgencyBranch('');
                            setSelectedProvince('');
                            return;
                          }
                          setSelectedAgencyBranch(\`\${a.nombre} – \${a.distrito}, \${a.provincia}\`);
                          setSelectedProvince(a.provincia);
                          setSelectedDistrict(a.distrito);
                        }}
                      />`;

if (content.includes(oldBranchBlock)) {
  content = content.replace(oldBranchBlock, newBranchBlock);
  console.log('✅ Branch block simplified to ShalomBuscador only');
} else {
  console.log('⚠️  Branch block not found');
}

// 4. Fix onClick handlers referencing ['Shalom','Olva','Marvisure']
content = content.replace(
  `if (!['Shalom','Olva','Marvisure'].includes(shippingAgency)) { setShippingAgency('Shalom'); setSelectedAgencyBranch(''); }`,
  `setShippingAgency('Shalom'); setSelectedAgencyBranch('');`
);
content = content.replace(
  `if (!['Shalom','Olva','Marvisure'].includes(shippingAgency)) setShippingAgency('Shalom');`,
  `setShippingAgency('Shalom');`
);

// 5. Fix the shippingAgency state references for Olva/Marvisure in nota template
content = content.replace(
  `shippingAgency: deliveryType === 'provincia' ? shippingAgency.toUpperCase() : 'MOTORIZADO EXPRESS LIMA',`,
  `shippingAgency: deliveryType === 'provincia' ? 'SHALOM' : 'MOTORIZADO EXPRESS LIMA',`
);

// 6. Remove the selectedAgencyBranch !== '' checks for Olva/Marvisure
content = content.replace(/\['Shalom', 'Olva', 'Marvisure'\]\.includes\(shippingAgency\)/g, 'true');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File saved. Shalom-only mode active.');
