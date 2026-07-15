import re

with open('/app/applet/src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# Add imports for storage
content = content.replace("import { doc, getDoc, updateDoc } from 'firebase/firestore';", "import { doc, getDoc, updateDoc } from 'firebase/firestore';\nimport { storage } from '../firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';")

upload_ui = """
                    {settings.liquidBackgroundType === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">URL de Imagen (o sube un archivo en Firebase)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={settings.liquidBackgroundValue || ''}
                            onChange={(e) => updateSettings({ liquidBackgroundValue: e.target.value })}
                            className="flex-1 bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                          <label className="p-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl cursor-pointer hover:bg-indigo-200 transition-colors">
                            <Upload className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setLoading(true);
                                  showToast("Subiendo imagen...", "info");
                                  const storageRef = ref(storage, `backgrounds/${user?.uid || 'global'}_${Date.now()}_${file.name}`);
                                  await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(storageRef);
                                  updateSettings({ liquidBackgroundValue: url });
                                  showToast("Imagen subida y aplicada", "success");
                                } catch (error) {
                                  console.error("Error al subir:", error);
                                  showToast("Error al subir la imagen", "error");
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
"""

# Replace the existing custom block
old_custom = """                    {settings.liquidBackgroundType === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">URL de Imagen (o sube un archivo en Firebase)</label>
                        <input
                          type="url"
                          value={settings.liquidBackgroundValue || ''}
                          onChange={(e) => updateSettings({ liquidBackgroundValue: e.target.value })}
                          className="w-full bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                    )}"""

content = content.replace(old_custom, upload_ui)

with open('/app/applet/src/pages/Settings.tsx', 'w') as f:
    f.write(content)

