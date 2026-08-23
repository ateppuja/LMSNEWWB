import Swal from "sweetalert2";

export const swal = Swal.mixin({
  confirmButtonColor: "oklch(0.52 0.14 152)",
  cancelButtonColor: "oklch(0.60 0.05 155)",
});

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

export const confirmDelete = async (name = "item ini") => {
  const r = await swal.fire({
    title: "Yakin hapus?",
    text: `Anda akan menghapus ${name}. Tindakan ini tidak dapat dibatalkan.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });
  return r.isConfirmed;
};

export const successToast = (title: string) =>
  toast.fire({ icon: "success", title });
