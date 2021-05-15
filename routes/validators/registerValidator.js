const { check } = require("express-validator");

const registerValidator = [
  check("username")
    .exists()
    .withMessage("Vui lòng nhập tên người dùng")
    .notEmpty()
    .withMessage("Không được để trống tên người dùng")
    .isLength({ min: 6 })
    .withMessage("Tên người dùng phải từ 6 ký tự"),

  check("password")
    .exists()
    .withMessage("Vui lòng nhập mật khẩu")
    .notEmpty()
    .withMessage("Không được để trống mật khẩu")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải từ 6 ký tự"),

  check("rePassword")
    .exists()
    .withMessage("Vui lòng nhập xác nhận mật khẩu")
    .notEmpty()
    .withMessage("Vui lòng nhập xác nhận mật khẩu")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Mật khẩu không khớp");
      }
      return true;
    }),
  check("role")
    .exists()
    .withMessage("Vui lòng chọn ít nhất 1 Phòng/Khoa")
    .notEmpty()
    .withMessage("Vui lòng chọn ít nhất 1 Phòng/Khoa"),
];

module.exports = registerValidator;
