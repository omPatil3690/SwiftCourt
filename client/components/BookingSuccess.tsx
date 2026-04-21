import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { CheckCircle, Calendar, Clock, MapPin, Download, Share2, ArrowRight, FileDown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface BookingSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    id: string;
  receiptId: string;
    facilityName: string;
    courtName: string;
    location: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
  };
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({
  isOpen,
  onClose,
  bookingData,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: Log the booking data when component mounts
  React.useEffect(() => {
    if (isOpen && bookingData) {
      console.log('BookingSuccess component opened with data:', bookingData);
    }
  }, [isOpen, bookingData]);

  const formatDate = (dateString: string) => {
    try {
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      const d = iso.test(dateString) ? new Date(dateString + 'T00:00:00') : new Date(dateString);
      if (Number.isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const d = new Date(`2000-01-01T${timeString}`);
      if (Number.isNaN(d.getTime())) return timeString;
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const handleShare = async () => {
    const bookingText = `🎾 Booking Confirmed at ${bookingData.facilityName}!\n\n📍 ${bookingData.location}\n🏟️ ${bookingData.courtName}\n📅 ${formatDate(bookingData.date)}\n🕐 ${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}\n💰 ₹${bookingData.price}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickCourt Booking Confirmed',
          text: bookingText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(bookingText);
      toast({
        title: "Copied to clipboard",
        description: "Booking details copied to clipboard!",
      });
    }
  };

  // Estimate points (mirrors backend: ~10 pts per hour) so user sees immediate feedback.
  const estimatedPoints = (() => {
    try {
      const [sh] = bookingData.startTime.split(':').map(Number);
      const [eh] = bookingData.endTime.split(':').map(Number);
      const dur = Math.max(1, eh - sh);
      return dur * 10;
    } catch { return 10; }
  })();

  const handleDownloadReceipt = () => {
    console.log('PDF download initiated', { bookingData });
    
    const w = window.open('', 'PRINT', 'height=650,width=900,top=100,left=150');
    if (!w) {
      console.error('Failed to open print window - likely blocked by popup blocker');
      // Show user-friendly error if popup is blocked
      toast({
        title: "PDF Download Failed",
        description: "Unable to open print window. Please allow popups for this site and try again.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Print window opened successfully');
    
    try {
    const price = Number(bookingData.price) || 0;
    const durationHours = (() => {
      const [sh, sm] = bookingData.startTime.split(':').map(n => Number(n) || 0);
      const [eh, em] = bookingData.endTime.split(':').map(n => Number(n) || 0);
      return Math.max(0.5, (eh * 60 + em - (sh * 60 + sm)) / 60);
    })();
    const rate = durationHours > 0 ? Math.round(price / durationHours) : price;
    const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const html = `
      <html>
      <head>
        <title>Receipt - QuickCourt</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root{ --green:#065f46; --muted:#6b7280; --border:#e5e7eb; --bg:#ffffff; }
          *{ box-sizing:border-box; }
          body{ margin:0; background:#f8fafc; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
          .page{ max-width:760px; margin:24px auto; background:var(--bg); padding:28px; border:1px solid var(--border); border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,0.06); }
          .header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
          .brand{ display:flex; align-items:center; gap:10px; }
          .logo{ width:36px; height:36px; border-radius:8px; background:#d1fae5; display:flex; align-items:center; justify-content:center; color:var(--green); font-weight:900; }
          .brand-text{ font-weight:800; font-size:20px; color:var(--green); letter-spacing:0.2px; }
          .receipt-meta{ text-align:right; font-size:12px; color:var(--muted); }
          .title{ font-weight:700; font-size:22px; margin:8px 0 2px; color:#111827; }
          .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin:16px 0 10px; }
          .panel{ border:1px solid var(--border); border-radius:8px; padding:12px; }
          .panel h4{ margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:#374151; }
          .kv{ display:flex; justify-content:space-between; gap:16px; font-size:14px; margin:6px 0; }
          .kv .k{ color:#4b5563; }
          table{ width:100%; border-collapse:collapse; margin-top:8px; }
          th, td{ font-size:14px; text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); }
          th{ background:#f9fafb; color:#374151; font-weight:600; }
          .right{ text-align:right; }
          .totals{ margin-top:12px; width:100%; }
          .totals .row{ display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
          .totals .grand{ border-top:1px dashed var(--border); margin-top:6px; padding-top:12px; font-weight:800; color:var(--green); font-size:18px; }
          .footer{ margin-top:18px; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; align-items:center; }
          .note{ max-width:70%; }
          @media print{
            body{ background:#fff; }
            .page{ margin:0; border:none; box-shadow:none; }
            .footer{ color:#6b7280; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <div class="logo">QC</div>
              <div class="brand-text">QuickCourt</div>
            </div>
            <div class="receipt-meta">
              <div>Receipt No: <strong>${bookingData.receiptId}</strong></div>
              <div>Booking ID: <strong>${bookingData.id.slice(-8).toUpperCase()}</strong></div>
              <div>Date Issued: ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div class="title">Payment Receipt</div>

          <div class="grid">
            <div class="panel">
              <h4>Venue Details</h4>
              <div class="kv"><div class="k">Facility</div><div class="v">${bookingData.facilityName}</div></div>
              <div class="kv"><div class="k">Court</div><div class="v">${bookingData.courtName}</div></div>
              <div class="kv"><div class="k">Location</div><div class="v">${bookingData.location}</div></div>
            </div>
            <div class="panel">
              <h4>Booking Info</h4>
              <div class="kv"><div class="k">Sport</div><div class="v">${bookingData.sport}</div></div>
              <div class="kv"><div class="k">Date</div><div class="v">${formatDate(bookingData.date)}</div></div>
              <div class="kv"><div class="k">Time</div><div class="v">${formatTime(bookingData.startTime)} – ${formatTime(bookingData.endTime)}</div></div>
              <div class="kv"><div class="k">Duration</div><div class="v">${durationHours} hour${durationHours > 1 ? 's' : ''}</div></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Rate</th>
                <th class="right">Qty (hrs)</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Court booking — ${bookingData.facilityName} (${bookingData.courtName})</td>
                <td class="right">${currency(rate)}</td>
                <td class="right">${durationHours}</td>
                <td class="right">${currency(price)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><div>Subtotal</div><div>${currency(price)}</div></div>
            <div class="row"><div>Taxes</div><div>—</div></div>
            <div class="row grand"><div>Total Paid</div><div>${currency(price)}</div></div>
          </div>

          <div class="footer">
            <div class="note">Thank you for booking with QuickCourt. Please arrive 10 minutes early. For changes or cancellations, see your booking details in the app.</div>
            <div>quickcourt.example • support@quickcourt.example</div>
          </div>
        </div>
        <script>
          window.print();
          // Close window after user finishes with print dialog
          window.onafterprint = function() {
            window.close();
          };
          // Fallback: close after 3 seconds if onafterprint is not supported
          setTimeout(function() {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while creating the receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Alternative download method using HTML download attribute
  const handleDownloadReceiptHtml = () => {
    try {
      const price = Number(bookingData.price) || 0;
      const durationHours = (() => {
        const [sh, sm] = bookingData.startTime.split(':').map(n => Number(n) || 0);
        const [eh, em] = bookingData.endTime.split(':').map(n => Number(n) || 0);
        return Math.max(0.5, (eh * 60 + em - (sh * 60 + sm)) / 60);
      })();
      const rate = durationHours > 0 ? Math.round(price / durationHours) : price;
      const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

      const html = `<!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - QuickCourt</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; }
            .receipt { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin: 20px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>QuickCourt Receipt</h1>
              <p>Booking ID: ${bookingData.id.slice(-8).toUpperCase()}</p>
            </div>
            <div class="details">
              <p><strong>Venue:</strong> ${bookingData.facilityName}</p>
              <p><strong>Court:</strong> ${bookingData.courtName}</p>
              <p><strong>Date:</strong> ${formatDate(bookingData.date)}</p>
              <p><strong>Time:</strong> ${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}</p>
              <p><strong>Location:</strong> ${bookingData.location}</p>
            </div>
            <div class="total">
              <p>Total Paid: ${currency(price)}</p>
            </div>
          </div>
        </body>
        </html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QuickCourt-Receipt-${bookingData.id.slice(-8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been downloaded as an HTML file.",
      });
    } catch (error) {
      console.error('Alternative download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download receipt. Please try the print option.",
        variant: "destructive"
      });
    }
  };

  const handleDirectDownload = () => {
    const price = Number(bookingData.price) || 0;
    const durationHours = (() => {
      const [sh, sm] = bookingData.startTime.split(':').map(n => Number(n) || 0);
      const [eh, em] = bookingData.endTime.split(':').map(n => Number(n) || 0);
      return Math.max(0.5, (eh * 60 + em - (sh * 60 + sm)) / 60);
    })();
    const rate = durationHours > 0 ? Math.round(price / durationHours) : price;
    const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const receiptContent = `
╔══════════════════════════════════════════════════════════════╗
║                    🏸 QUICKCOURT RECEIPT                     ║
╚══════════════════════════════════════════════════════════════╝

Receipt ID: ${bookingData.receiptId}
Booking ID: ${bookingData.id}
Generated: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}

───────────────────────────── BOOKING DETAILS ─────────────────────────────

🏟️  Facility: ${bookingData.facilityName}
🏸  Court: ${bookingData.courtName}
📍  Location: ${bookingData.location}
🎾  Sport: ${bookingData.sport}

📅  Date: ${formatDate(bookingData.date)}
🕐  Time: ${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}
⏱️   Duration: ${durationHours} hour${durationHours !== 1 ? 's' : ''}
💰  Rate: ${currency(rate)}/hour

──────────────────────────── PAYMENT SUMMARY ───────────────────────────────

Subtotal                                              ${currency(price)}
Taxes & Fees                                                      ₹0
                                                    ──────────────────
TOTAL PAID                                            ${currency(price)}

──────────────────────────── IMPORTANT NOTES ───────────────────────────────

✓ Please arrive 10 minutes before your booking time
✓ Bring this receipt for verification
✓ Valid ID required for entry
✓ Follow facility rules and guidelines
✓ Contact support for any queries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for choosing QuickCourt!
🌐 Visit us at: quickcourt.com
📧 Support: support@quickcourt.com
📱 Download our app for easy bookings

This is an electronic receipt. Please save for your records.
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QuickCourt_Receipt_${bookingData.receiptId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Receipt downloaded",
      description: "Receipt has been downloaded to your device.",
    });
  };

  const handleViewBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  const handleBookAnother = () => {
    onClose();
    navigate('/venues');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <div className="text-center space-y-6">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-bold text-green-600">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600">
              Your court has been successfully booked. A receipt has been generated.
            </p>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 space-y-3">
                <div className="text-left">
                  <h3 className="font-semibold text-green-900 text-lg">
                    {bookingData.facilityName}
                  </h3>
                  <p className="text-sm text-green-700">{bookingData.courtName}</p>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{bookingData.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-green-700">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(bookingData.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-green-700">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="text-sm text-green-700">Total</span>
                  <span className="font-bold text-green-900">₹{bookingData.price}</span>
                </div>

                <div className="mt-2 rounded-md bg-white/60 border border-green-200 p-3">
                  <p className="text-xs font-medium text-green-800 mb-1">Loyalty Reward (est.)</p>
                  <p className="text-xs text-green-700">~{estimatedPoints} points will be added for this booking.</p>
                </div>

                <div className="flex items-center justify-between text-xs text-green-600">
                  <span>Booking ID: {bookingData.id.slice(-8).toUpperCase()}</span>
                  <span>Receipt: {bookingData.receiptId}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                onClick={handleDirectDownload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>

            {/* Primary Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleViewBookings}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View My Bookings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                onClick={handleBookAnother}
                variant="outline"
                className="w-full"
              >
                Book Another Court
              </Button>
            </div>
          </motion.div>

          {/* Important Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg"
          >
            <p>
              📧 A confirmation email has been sent to your registered email address.
              Please arrive 10 minutes before your booking time.
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSuccess;
