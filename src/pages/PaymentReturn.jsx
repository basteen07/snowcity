import { useSearchParams } from "react-router-dom";

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const cartRef = params.get("cart");

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">
        {status === "success" ? "Payment Successful" : "Payment Pending"}
      </h1>

      {cartRef && (
        <p className="mt-4 text-gray-600">Cart Reference: {cartRef}</p>
      )}

      <a href="/my-bookings" className="mt-6 inline-block text-blue-600 underline">
        Go to My Bookings
      </a>
    </div>
  );
}
