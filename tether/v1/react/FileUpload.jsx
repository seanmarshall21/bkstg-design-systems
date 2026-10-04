import { useId, useState } from "react";
import { cx } from "./cx.js";

const UP = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>;
const FILE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>;
const X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const size = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

/**
 * <FileUpload hint="PDF or images, up to 10 MB" accept=".pdf,image/*" files={files} onChange={setFiles} />
 * A drop zone that is also a file button (keyboard and screen readers get the real input), and the chosen files.
 * It only collects files: uploading them is the app's job.
 */
export function FileUpload({ files = [], onChange, accept, multiple = true, hint, className }) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  const add = (list) => onChange?.([...files, ...Array.from(list)]);
  return (
    <div className={className}>
      <label className={cx("ui-dropzone", drag && "is-drag")} htmlFor={id}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}>
        <span className="ui-dropzone-icon">{UP}</span>
        <span><strong>Click to upload</strong> or drag and drop</span>
        {hint ? <small>{hint}</small> : null}
        <input id={id} type="file" accept={accept} multiple={multiple} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </label>
      {files.length ? (
        <ul className="ui-files" aria-label="Chosen files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="ui-file">{FILE}<span className="ui-file-name">{f.name}</span><span className="ui-file-size">{size(f.size)}</span>
              <button type="button" className="ui-tag-remove" aria-label={`Remove ${f.name}`} onClick={() => onChange?.(files.filter((_, j) => j !== i))}>{X}</button></li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
