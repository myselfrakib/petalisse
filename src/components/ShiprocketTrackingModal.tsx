import React, { useState, useEffect } from 'react';
import { Order, OrderShipmentInfo } from '../types';
import {
  syncShiprocketStatus,
  cancelShiprocketShipment,
  TrackingResult,
} from '../lib/shiprocket';

interface ShiprocketTrackingModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdateShipment: (shipment: Partial<OrderShipmentInfo>, newStatus?: Order['status']) => void;
}

export const ShiprocketTrackingModal: React.FC<ShiprocketTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateShipment,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [syncResult, setSyncResult] = useState<TrackingResult | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);

  const shipment = order.shipment;

  const handleSyncStatus = async () => {
    if (!shipment) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await syncShiprocketStatus({
        shiprocketOrderId: shipment.shiprocketOrderId,
        shipmentId: shipment.shipmentId,
        awbCode: shipment.awbCode,
      });

      setSyncResult(res);

      if (res.isCancelled) {
        // Automatically sync to local state & database!
        // Reset order status back to processing (or keep active), NOT cancelled
        const resetStatus: Order['status'] = order.status === 'shipped' ? 'processing' : order.status;
        onUpdateShipment(
          {
            status: 'CANCELED',
            cancelledAt: new Date().toISOString(),
          },
          resetStatus
        );
        setStatusMessage('Shipment is cancelled in Shiprocket. Order remains active in Processing.');
      } else if (res.status === 'DELIVERED') {
        onUpdateShipment({ status: 'DELIVERED' }, 'delivered');
        setStatusMessage('Status synced: Package has been delivered!');
      } else {
        onUpdateShipment({
          status: res.status || shipment.status,
          awbCode: res.awbCode || shipment.awbCode,
          courierName: res.courierName || shipment.courierName,
        });
        setStatusMessage('Shipment status refreshed from Shiprocket.');
      }
    } catch (e: any) {
      console.warn('Sync failed:', e);
      setStatusMessage('Could not connect to Shiprocket tracking servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && shipment) {
      handleSyncStatus();
    }
  }, [isOpen]);

  if (!isOpen || !shipment) return null;

  const isCancelled =
    shipment.status === 'CANCELED' ||
    shipment.status === 'CANCELLED' ||
    Boolean(syncResult?.isCancelled);

  const handleCancelShipment = async () => {
    const confirm = window.confirm(
      'Are you sure you want to cancel this Shiprocket shipment and pickup? This will cancel the booking with the courier partner.'
    );
    if (!confirm) return;

    setCancelling(true);
    setStatusMessage(null);

    try {
      const res = await cancelShiprocketShipment({
        shiprocketOrderId: shipment.shiprocketOrderId,
        shipmentId: shipment.shipmentId,
        awbCode: shipment.awbCode,
      });

      if (res.success) {
        // Reset order status back to processing (or keep active), NOT cancelled
        const resetStatus: Order['status'] = order.status === 'shipped' ? 'processing' : order.status;
        onUpdateShipment(
          {
            status: 'CANCELED',
            cancelledAt: new Date().toISOString(),
          },
          resetStatus
        );
        setStatusMessage('Shipment cancelled successfully in Shiprocket. Order remains active in Processing.');
        handleSyncStatus();
      } else {
        setStatusMessage(res.message || 'Cancellation request could not be processed.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to cancel shipment on Shiprocket.');
    } finally {
      setCancelling(false);
    }
  };

  const copyAwb = () => {
    if (shipment.awbCode) {
      navigator.clipboard.writeText(shipment.awbCode);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EAE3D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-2xl flex items-center justify-center shadow-2xs ${
                isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-[#FAF0ED] text-[#8E5B59]'
              }`}
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-[#2C2724] font-semibold">
                  Shiprocket Live Tracking & Sync
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isCancelled
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Shipment: {isCancelled ? 'Cancelled' : shipment.status || 'Active'}
                </span>
                <span className="text-xs text-[#786F66]">
                  · Order Status:{' '}
                  <strong className="capitalize text-[#2C2724]">
                    {order.status}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-[#786F66]">
                Order {order.orderNumber || `#${order.id}`} · Direct carrier tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-[#F3EDE2] text-[#786F66] flex items-center justify-center transition cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                statusMessage.includes('cancelled') || statusMessage.includes('Cancelled')
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>ℹ️</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Shipment Overview Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-3 shadow-2xs text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[10px] text-[#786F66] uppercase font-bold">
                  Carrier Partner
                </span>
                <span className="font-semibold text-[#2C2724]">
                  {shipment.courierName || 'Assigned Courier'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-[#786F66] uppercase font-bold">
                  AWB Code
                </span>
                {shipment.awbCode ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#8E5B59]">
                      {shipment.awbCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyAwb}
                      className="text-[10px] text-[#786F66] hover:text-[#2C2724] underline cursor-pointer"
                    >
                      {copiedAwb ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <span className="text-[#8C827A]">Pending Generation</span>
                )}
              </div>

              <div>
                <span className="block text-[10px] text-[#786F66] uppercase font-bold">
                  Pickup Date
                </span>
                <span className="font-medium text-[#2C2724]">
                  {shipment.pickupDate || 'Scheduled'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-[#786F66] uppercase font-bold">
                  Shipping Cost
                </span>
                <span className="font-semibold text-[#2C2724]">
                  {shipment.rate ? `₹${shipment.rate.toFixed(2)}` : 'Calculated'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F3EDE2] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#786F66]">
              <div>
                Dispatch Hub: <strong>{shipment.pickupLocation || 'Warehouse'}</strong>
              </div>
              {shipment.shiprocketOrderId && (
                <div>
                  Shiprocket ID: <strong>{shipment.shiprocketOrderId}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Destination Summary */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D8] text-xs space-y-1">
            <span className="block text-[10px] text-[#786F66] uppercase font-bold">
              Delivering To
            </span>
            <div className="font-medium text-[#2C2724]">
              {order.customerName} ({order.phone})
            </div>
            <div className="text-[#6D635B]">{order.shippingAddress}</div>
          </div>

          {/* Live Status and Activities Timeline */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#F3EDE2] pb-2">
              <span className="text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                Live Tracking Activity
              </span>
              <button
                type="button"
                onClick={handleSyncStatus}
                disabled={loading}
                className="text-[11px] text-[#8E5B59] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                {loading ? 'Syncing...' : '↻ Check & Sync Live Status'}
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-[#786F66]">
                <div className="size-5 border-2 border-[#8E5B59] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Contacting Shiprocket tracking servers...
              </div>
            ) : isCancelled ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1.5">
                <span className="text-xl block">🚫</span>
                <div className="text-xs font-bold text-rose-900">Shipment Cancelled</div>
                <p className="text-[11px] text-rose-700 max-w-sm mx-auto">
                  This shipment booking has been cancelled in Shiprocket. The order itself remains active in{' '}
                  <strong className="capitalize">{order.status}</strong>. You can create a new shipment for this order anytime.
                </p>
              </div>
            ) : syncResult?.activities && syncResult.activities.length > 0 ? (
              <div className="space-y-3 pt-1">
                {syncResult.activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="size-2 rounded-full bg-[#8E5B59] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-[#2C2724]">{act.activity}</div>
                      <div className="text-[10px] text-[#786F66]">
                        {act.location} · {act.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center text-xs text-[#786F66]">
                <span className="text-lg block mb-1">📦</span>
                Shipment registered and waiting for carrier pickup on{' '}
                <strong className="text-[#2C2724]">{shipment.pickupDate || 'scheduled date'}</strong>.
                Live transit events will appear here once scanned by the courier.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#EAE3D8] flex items-center justify-between gap-3 shrink-0">
          <div>
            {!isCancelled ? (
              <button
                type="button"
                onClick={handleCancelShipment}
                disabled={cancelling}
                className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <span className="size-3 border-2 border-rose-700 border-t-transparent rounded-full animate-spin" />
                    Cancelling on Shiprocket...
                  </>
                ) : (
                  <>
                    <span>✕</span>
                    <span>Cancel Shipment on Shiprocket</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-rose-700 font-medium">
                Shipment has been cancelled
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncStatus}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition cursor-pointer"
            >
              Sync Status
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
