import { navigate } from "../app/router";

export function NotFoundPage() {
  return (
    <div className="module-empty large">
      <h1>Esta pagina no existe</h1>
      <button className="primary" onClick={() => navigate("/")}>
        Volver al inicio
      </button>
    </div>
  );
}
