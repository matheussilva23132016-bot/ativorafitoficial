export default function HeroSection() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#020617",
      color: "white",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      padding: "24px"
    }}>
      <div>
        <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>AtivoraFit</h1>
        <p>A evolução do fitness começa aqui.</p>
      </div>
    </section>
  );
}