// const Category = require("../models/Category");
// const Tag = require("../models/Category");

// // create tag ka handler function

// exports.createCategory = async (req, res) => {
//     try {
//         const { name, description } = req.body;

//         if (!name
//             // || !description
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'All fields are required'
//             });
//         }

//         // create entry in db
//         const CategorysDetails = await Category.create({
//             name: name,
//             description: description,
//         });
//         console.log(CategorysDetails);

//         // return response
//         return res.status(200).json({
//             success: true,
//             message: 'Category created successfully',
//         });
//     }
//     catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // get All Tags handler function

// exports.showAllCategories = async (req, res) => {
//     try {
//         const allCategorys = await Category.find(
//             {},
//             { name: true, description: true });
//         console.log("reached here , all category", allCategorys);
//         return res.status(200).json({
//             success: true,
//             data: allCategorys,
//             // message: 'All tags returned successfully',
//             // allTags,
//         });
//     }
//     catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // CategoryPageDetails

// exports.categoryPageDetails = async (req, res) => {
//     try {

//         // get category id
//         const { categoryId } = req.body;

//         // Get courses for the specified category
//         const selectedCategory = await Category.findById(categoryId)
//             .populate("courses")
//             .exec();
//         console.log(selectedCategory);

//         // Handle the case when category is not found
//         if (!selectedCategory) {
//             console.log("Category not found.");
//             return res.status(404).json({
//                 success: false,
//                 message: "Category not found"
//             });
//         }

//         // Handle the case when there are no courses
//         if (selectedCategory.courses.length === 0) {
//             console.log("No courses found for the selected category.");
//             return res.status(404).json({
//                 success: false,
//                 message: "No course found for the selected category",
//             });
//         }

//         const selectedCourses = selectedCategory.courses;

//         // Get courses for other categories
//         const categoriesExcceptSelected = await Category.find({
//             _id: { $ne: categoryId },
//         }).populate("courses");
//         let differentCourses = [];
//         for (const category of categoriesExcceptSelected) {
//             differentCourses.push(...category.courses);
//         }

//         // Get top selling courses across all categories
//         const allCategories = await Category.find().populate("course");
//         const allCourses = allCategories.flatMap((category) => category.courses);
//         const mostSellingCourses = allCourses
//             .sort((a, b) => b.sold - a.sold)
//             .slice(0, 10);

//         res.status(200).json({
//             selectedCourses: selectedCourses,
//             differentCourses: differentCourses,
//             mostSellingCourses: mostSellingCourses,
//         });

//     }
//     catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };
const { Mongoose } = require("mongoose");
const Category = require("../models/Category");
function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategorysDetails);
    return res.status(200).json({
      success: true,
      message: "Categorys Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};

exports.showAllCategories = async (req, res) => {
  try {
    console.log("INSIDE SHOW ALL CATEGORIES");
    const allCategorys = await Category.find({});
    res.status(200).json({
      success: true,
      data: allCategorys,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//categoryPageDetails 

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body
    console.log("PRINTING CATEGORY ID: ", categoryId);
    // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec()

    //console.log("SELECTED COURSE", selectedCategory)
    // Handle the case when the category is not found
    if (!selectedCategory) {
      console.log("Category not found.")
      return res
        .status(404)
        .json({ success: false, message: "Category not found" })
    }
    // Handle the case when there are no courses
    if (selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected category.")
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      })
    }

    // Get courses for other categories
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    })
    let differentCategory = await Category.findOne(
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
    )
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec()
    //console.log("Different COURSE", differentCategory)
    // Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec()
    const allCourses = allCategories.flatMap((category) => category.courses)
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)
    // console.log("mostSellingCourses COURSE", mostSellingCourses)
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}