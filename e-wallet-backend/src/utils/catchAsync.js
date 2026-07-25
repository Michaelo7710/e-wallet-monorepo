const catchAsync = (fn) => {
  return (req, res, next) => {
    // Menjalankan fungsi asinkron dan menangkap error jika terjadi (Promise rejection)
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;