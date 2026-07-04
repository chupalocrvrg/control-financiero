const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const targetSelectStr = `          <div>
            <select
              value={selectedCommerceEmployee}
              onChange={(e) => setSelectedCommerceEmployee(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none text-neutral-900 dark:text-neutral-100"
            >
              <option value="global">Resumen Global</option>
              {allCommerceData.map(d => (
                <option key={d.employee.id} value={d.employee.id}>{d.employee.name} {d.employee.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCommerceEmployee === 'global' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlobalCommerceCard allData={allCommerceData} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allCommerceData.filter(d => d.employee.id === selectedCommerceEmployee).map((data, idx) => (
              <CommerceCard key={idx} data={data} />
            ))}
          </div>
        )}
      </section>`;

const replaceSelectStr = `        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allCommerceData.map((data, idx) => (
            <CommerceCard key={idx} data={data} />
          ))}
        </div>
      </section>`;

content = content.replace(targetSelectStr, replaceSelectStr);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched dashboard UI");
