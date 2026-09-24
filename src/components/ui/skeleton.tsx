export function ReceiptSkeleton() {
  return <div className="receipt-skeleton" aria-label="Preparing a receipt" role="status">
    <div className="skeleton skeleton-title" />
    {Array.from({ length: 5 }, (_, index) => <div key={index} className="skeleton-line">
      <span className="skeleton" />
      <span className="skeleton" />
    </div>)}
    <div className="skeleton skeleton-total" />
  </div>;
}
