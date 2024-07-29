const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");

const deleteOneHandler = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("Invalid ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

const updateOneHandler = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("Invalid ID", 404));
    }

    res.status(200).json({
      status: "success",
      doc,
    });
  });

const createOneHandler = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      doc,
    });
  });

const getOneHandler = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("Invalid ID", 404));
    }
    res.status(200).json({
      status: "success",
      doc,
    });
  });

const getAllHandler = (Model) =>
  catchAsync(async (req, res, next) => {
    // To get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    res.status(200).json({
      status: "success",
      results: doc.length,
      doc,
    });
  });

module.exports = {
  deleteOneHandler,
  updateOneHandler,
  createOneHandler,
  getOneHandler,
  getAllHandler,
};
