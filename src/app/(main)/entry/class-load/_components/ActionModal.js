import Swal from 'sweetalert2';

export const ActionModal = {
  success: (message) => {
    return Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      confirmButtonColor: '#323E8F'
    });
  },

  error: (message) => {
    return Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonColor: '#323E8F'
    });
  },

  warning: (message) => {
    return Swal.fire({
      title: 'Warning!',
      text: message,
      icon: 'warning',
      confirmButtonColor: '#323E8F'
    });
  },

  confirmDelete: () => {
    return Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#323E8F',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
  }
};

export default ActionModal;
