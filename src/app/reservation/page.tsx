"use client";

import { useState } from "react";
import Link from "next/link";
import { rooms, siteConfig } from "@/data/content";

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    roomType: "",
    specialRequests: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would connect to a booking API
    alert("Thank you for your reservation request! Our team will contact you shortly to confirm your booking.");
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const selectedRoom = rooms.find(room => room.name === formData.roomType);
  const estimatedTotal = selectedRoom && nights > 0 ? selectedRoom.price * nights : 0;

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-primary to-accent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Book Your Stay
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Reserve your perfect getaway at Hotel Maison Blanche
          </p>
        </div>
      </section>

      {/* Reservation Form & Details */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
                    Reservation Details
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="+224 XXX XXX XXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stay Details */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Stay Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Check-in Date *
                          </label>
                          <input
                            type="date"
                            name="checkIn"
                            required
                            value={formData.checkIn}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Check-out Date *
                          </label>
                          <input
                            type="date"
                            name="checkOut"
                            required
                            value={formData.checkOut}
                            onChange={handleChange}
                            min={formData.checkIn || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Adults *
                          </label>
                          <select
                            name="adults"
                            value={formData.adults}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {[1, 2, 3, 4].map(num => (
                              <option key={num} value={num}>{num} Adult{num !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Children
                          </label>
                          <select
                            name="children"
                            value={formData.children}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {[0, 1, 2, 3, 4].map(num => (
                              <option key={num} value={num}>{num} Child{num !== 1 ? 'ren' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Room Selection */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Room Selection
                      </h3>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Room Type *
                        </label>
                        <select
                          name="roomType"
                          required
                          value={formData.roomType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select a room type</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.name}>
                              {room.name} - ${room.price}/night
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Special Requests
                      </h3>
                      <div>
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Please let us know about any special requirements, dietary restrictions, or celebration arrangements..."
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-amber-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors hover:shadow-lg"
                      >
                        Submit Reservation Request
                      </button>
                      <p className="text-gray-500 text-sm mt-4 text-center">
                        You will receive a confirmation email within 24 hours. 
                        Note: This is a reservation request. Your booking will be confirmed 
                        once we verify room availability.
                      </p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Booking Summary */}
              <div>
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-6">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    Booking Summary
                  </h3>

                  {selectedRoom ? (
                    <div className="space-y-6">
                      {/* Room Details */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{selectedRoom.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">{selectedRoom.description}</p>
                        <div className="text-primary font-bold text-lg">
                          ${selectedRoom.price} <span className="text-gray-500 text-sm">per night</span>
                        </div>
                      </div>

                      {/* Stay Duration */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Stay Duration</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check-in:</span>
                            <span className="font-medium">{formData.checkIn || "Select date"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check-out:</span>
                            <span className="font-medium">{formData.checkOut || "Select date"}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-600">Total Nights:</span>
                            <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Guest Count */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Guests</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Adults:</span>
                            <span className="font-medium">{formData.adults}</span>
                          </div>
                          {formData.children !== "0" && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Children:</span>
                              <span className="font-medium">{formData.children}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estimated Total */}
                      {nights > 0 && estimatedTotal > 0 && (
                        <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-lg text-white">
                          <h4 className="font-semibold mb-3">Estimated Total</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Room Rate:</span>
                              <span>${selectedRoom.price} × {nights} nights</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20">
                              <span>Total:</span>
                              <span>${estimatedTotal.toFixed(2)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-white/80 mt-3">
                            * Taxes and service charges will be calculated during confirmation
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="text-gray-500 text-sm space-y-2">
                        <p>✓ Free cancellation up to 48 hours before check-in</p>
                        <p>✓ No prepayment required - pay at the hotel</p>
                        <p>✓ Free WiFi & breakfast included</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🏨</div>
                      <p className="text-gray-600">
                        Select a room type and dates to see your booking summary
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="mt-6 bg-secondary text-white rounded-2xl p-6">
                  <h4 className="font-semibold mb-4">Need Assistance?</h4>
                  <p className="text-sm mb-4">
                    Our reservation team is available 24/7 to help with your booking.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">📞 +224 123 456 789</p>
                    <p className="text-sm">✉️ reservations@maisonblanche.coyah.gn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Book With Us */}
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Why Book Directly With Us
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "🎯",
                    title: "Best Price Guarantee",
                    description: "We guarantee the best rates when you book directly with us.",
                  },
                  {
                    icon: "✨",
                    title: "Exclusive Benefits",
                    description: "Get free upgrades, late check-out, and welcome drinks.",
                  },
                  {
                    icon: "🤝",
                    title: "Personalized Service",
                    description: "Our team will handle all your requests and preferences.",
                  },
                ].map((benefit, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-5xl mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-12">
              <Link
                href="/"
                className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}