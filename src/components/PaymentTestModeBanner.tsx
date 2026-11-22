const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) return <div className="mb-4 rounded-xl border bg-muted px-4 py-2 text-center text-sm">Le paiement en ligne n'est pas encore activé.</div>;
  if (clientToken.startsWith("pk_test_")) return <div className="mb-4 rounded-xl border bg-accent/40 px-4 py-2 text-center text-sm">Mode test : aucun vrai paiement. Carte de test 4242 4242 4242 4242.</div>;
  return null;
}
