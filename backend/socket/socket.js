import Bus from '../models/Bus.js';

export const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Join a specific bus room
        socket.on('joinBus', (busId) => {
            socket.join(`bus_${busId}`);
            console.log(`🚌 Socket ${socket.id} joined bus room: bus_${busId}`);
        });

        // Driver updates location
        socket.on('updateLocation', async (data) => {
            try {
                const { busId, lat, lng, heading, speed } = data;

                if (!busId || !lat || !lng) {
                    socket.emit('error', { message: 'Invalid location data' });
                    return;
                }

                // Update bus location in database
                const bus = await Bus.findByIdAndUpdate(
                    busId,
                    {
                        currentLocation: { lat, lng },
                        lastUpdated: new Date()
                    },
                    { new: true }
                );

                if (!bus) {
                    socket.emit('error', { message: 'Bus not found' });
                    return;
                }

                // Broadcast location update to all clients tracking this bus
                io.to(`bus_${busId}`).emit('busLocationUpdated', {
                    busId,
                    busNumber: bus.busNumber,
                    lat,
                    lng,
                    heading: heading || 0,
                    speed: speed || 0,
                    timestamp: new Date()
                });

                console.log(`📍 Location updated for bus ${bus.busNumber}: ${lat}, ${lng}`);
            } catch (error) {
                console.error('Error updating location:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Leave bus room
        socket.on('leaveBus', (busId) => {
            socket.leave(`bus_${busId}`);
            console.log(`🚪 Socket ${socket.id} left bus room: bus_${busId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};
