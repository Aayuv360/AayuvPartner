interface OrderStatusProgressProps {
  status: string;
}

export default function OrderStatusProgress({ status }: OrderStatusProgressProps) {
  const statuses = ['assigned', 'picked_up', 'on_the_way', 'delivered'];
  const currentIndex = statuses.indexOf(status);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'picked_up': return 'Picked up';
      case 'on_the_way': return 'On the way';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className={currentIndex >= 1 ? 'text-secondary font-medium' : ''}>
          Picked up
        </span>
        <span className={currentIndex >= 2 ? 'text-warning font-medium' : ''}>
          On the way
        </span>
        <span className={currentIndex >= 3 ? 'text-secondary font-medium' : ''}>
          Delivered
        </span>
      </div>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${currentIndex >= 1 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
        <div className={`flex-1 h-1 mx-1 ${currentIndex >= 2 ? 'bg-warning' : 'bg-gray-200'}`}></div>
        <div className={`w-3 h-3 rounded-full ${currentIndex >= 2 ? 'bg-warning' : 'bg-gray-200'}`}></div>
        <div className={`flex-1 h-1 mx-1 ${currentIndex >= 3 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
        <div className={`w-3 h-3 rounded-full ${currentIndex >= 3 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
}
