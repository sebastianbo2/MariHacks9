const recipes = [
    {
        "title": "Roasted Chicken Drumsticks",
        "store_name": "Maxi",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 5.88,
                "name": "Chicken Drumsticks",
                "quantity": 0.5,
                "usedQuantity": 0.5
            },
            {
                "price": 0,
                "name": "salt",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "pepper",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 5.88,
        "priceForRecipe": 5.88,
        "numberOfServings": 2,
        "description": "Simple roasted chicken legs seasoned with salt and pepper.",
        "prepMinutes": 5,
        "cookMinutes": 40
    },
    {
        "title": "Tuna Salad Sandwiches",
        "store_name": "Walmart",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 6.97,
                "name": "Great Value Tuna",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 3.99,
                "name": "POM Sliced Bread",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 10.96,
        "priceForRecipe": 10.96,
        "numberOfServings": 1,
        "description": "Easy lunch using canned tuna and pantry staples.",
        "prepMinutes": 5,
        "cookMinutes": 0
    },
    {
        "title": "Stir-fry with Cabbage and Chicken",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Green Cabbage",
                "quantity": 0.25,
                "usedQuantity": 0.25
            },
            {
                "price": 4.5,
                "name": "Chicken Drumsticks",
                "quantity": 0.25,
                "usedQuantity": 0.25
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 8.49,
        "priceForRecipe": 8.49,
        "numberOfServings": 2,
        "description": "A budget-friendly stir-fry featuring green cabbage.",
        "prepMinutes": 10,
        "cookMinutes": 10
    },
    {
        "title": "Pasta with Tomato Sauce",
        "store_name": "IGA",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 0,
                "name": "Catelli Pasta",
                "quantity": 250,
                "usedQuantity": 250
            },
            {
                "price": 8,
                "name": "Selection Tomato Sauce",
                "quantity": 0.5,
                "usedQuantity": 0.5
            }
        ],
        "totalPrice": 8,
        "priceForRecipe": 8,
        "numberOfServings": 2,
        "description": "A classic student staple using affordable canned sauce.",
        "prepMinutes": 2,
        "cookMinutes": 10
    },
    {
        "title": "Classic Scrambled Eggs on Toast",
        "store_name": "Adonis",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.98,
                "name": "Eggs",
                "quantity": 3,
                "usedQuantity": 3
            },
            {
                "price": 1.79,
                "name": "POM Sliced Bread",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 5.77,
        "priceForRecipe": 5.77,
        "numberOfServings": 1,
        "description": "A fast, high-protein breakfast or quick dinner.",
        "prepMinutes": 2,
        "cookMinutes": 3
    },
    {
        "title": "Potato and Cabbage Soup",
        "store_name": "Maxi",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 5.88,
                "name": "Small Potatoes",
                "quantity": 0.5,
                "usedQuantity": 0.5
            },
            {
                "price": 3.99,
                "name": "Green Cabbage",
                "quantity": 0.5,
                "usedQuantity": 0.5
            },
            {
                "price": 6.97,
                "name": "Swanson Chicken Broth",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 16.84,
        "priceForRecipe": 16.84,
        "numberOfServings": 4,
        "description": "A hearty, warm soup for cold Montreal days.",
        "prepMinutes": 10,
        "cookMinutes": 30
    },
    {
        "title": "Pan-seared Cod with Herbs",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Fresh Icelandic Cod Loin",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 3.99,
        "priceForRecipe": 3.99,
        "numberOfServings": 1,
        "description": "Fast and healthy Icelandic cod fillet.",
        "prepMinutes": 5,
        "cookMinutes": 8
    },
    {
        "title": "Hummus and Cucumber Wraps",
        "store_name": "Maxi",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 5.88,
                "name": "PC Hummus",
                "quantity": 0.25,
                "usedQuantity": 0.25
            },
            {
                "price": 0,
                "name": "Mini Cucumbers",
                "quantity": 3,
                "usedQuantity": 3
            }
        ],
        "totalPrice": 5.88,
        "priceForRecipe": 5.88,
        "numberOfServings": 2,
        "description": "Refreshing snack or light meal.",
        "prepMinutes": 5,
        "cookMinutes": 0
    },
    {
        "title": "Simple Baked Salmon",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Fresh Norwegian Salmon Fillet",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "salt",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 3.99,
        "priceForRecipe": 3.99,
        "numberOfServings": 1,
        "description": "Norwegian salmon fillet baked to perfection.",
        "prepMinutes": 5,
        "cookMinutes": 15
    },
    {
        "title": "Loaded Baked Potatoes",
        "store_name": "Maxi",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 5.88,
                "name": "Russet Potatoes",
                "quantity": 2,
                "usedQuantity": 2
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 5.88,
        "priceForRecipe": 5.88,
        "numberOfServings": 2,
        "description": "Hearty baked potatoes with various pantry spices.",
        "prepMinutes": 5,
        "cookMinutes": 60
    },
    {
        "title": "Oatmeal with Frozen Fruit",
        "store_name": "Maxi",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 5.88,
                "name": "PC Frozen Fruit",
                "quantity": 0.5,
                "usedQuantity": 0.5
            },
            {
                "price": 0,
                "name": "granulated sugar",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 5.88,
        "priceForRecipe": 5.88,
        "numberOfServings": 2,
        "description": "Warm breakfast to start the day.",
        "prepMinutes": 2,
        "cookMinutes": 5
    },
    {
        "title": "Chicken Noodle Soup",
        "store_name": "Super C",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 8,
                "name": "Mr. Noodles",
                "quantity": 2,
                "usedQuantity": 2
            },
            {
                "price": 5.88,
                "name": "Campbell's Broth",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 13.88,
        "priceForRecipe": 13.88,
        "numberOfServings": 2,
        "description": "Comforting soup using noodles and broth.",
        "prepMinutes": 5,
        "cookMinutes": 10
    },
    {
        "title": "Sausage and Vegetable Skillet",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Fresh Sausages",
                "quantity": 2,
                "usedQuantity": 2
            },
            {
                "price": 3.99,
                "name": "Mini Cucumbers",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 7.98,
        "priceForRecipe": 7.98,
        "numberOfServings": 2,
        "description": "Quick meal with fresh sausages and vegetables.",
        "prepMinutes": 5,
        "cookMinutes": 15
    },
    {
        "title": "Fried Rice with Vegetables",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 10.73,
                "name": "Rice",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 10.73,
        "priceForRecipe": 10.73,
        "numberOfServings": 2,
        "description": "Budget-friendly fried rice using pantry staples.",
        "prepMinutes": 5,
        "cookMinutes": 10
    },
    {
        "title": "Tofu Vegetable Stir-fry",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 2.93,
                "name": "Tofu",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 3.99,
                "name": "Green Cabbage",
                "quantity": 0.25,
                "usedQuantity": 0.25
            }
        ],
        "totalPrice": 6.92,
        "priceForRecipe": 6.92,
        "numberOfServings": 2,
        "description": "Vegetarian high-protein option.",
        "prepMinutes": 10,
        "cookMinutes": 10
    },
    {
        "title": "Simple Pasta with Garlic Oil",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.15,
                "name": "Pasta",
                "quantity": 500,
                "usedQuantity": 500
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 3.15,
        "priceForRecipe": 3.15,
        "numberOfServings": 2,
        "description": "Minimalist pasta dish.",
        "prepMinutes": 2,
        "cookMinutes": 8
    },
    {
        "title": "Grilled Pork Shoulder",
        "store_name": "IGA",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 0,
                "name": "Pork Shoulder Roast",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "salt",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 0,
        "priceForRecipe": 0,
        "numberOfServings": 4,
        "description": "Slow-cooked or grilled pork shoulder.",
        "prepMinutes": 10,
        "cookMinutes": 60
    },
    {
        "title": "Cucumber and Onion Salad",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 0,
                "name": "Mini Cucumbers",
                "quantity": 4,
                "usedQuantity": 4
            },
            {
                "price": 3.99,
                "name": "Yellow Onions",
                "quantity": 0.5,
                "usedQuantity": 0.5
            }
        ],
        "totalPrice": 3.99,
        "priceForRecipe": 3.99,
        "numberOfServings": 2,
        "description": "Refreshing side dish.",
        "prepMinutes": 5,
        "cookMinutes": 0
    },
    {
        "title": "Pan-fried Haddock",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Fresh Icelandic Haddock Fillet",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 3.99,
        "priceForRecipe": 3.99,
        "numberOfServings": 1,
        "description": "Quick fish fillet dinner.",
        "prepMinutes": 5,
        "cookMinutes": 10
    },
    {
        "title": "Sweet Potato Fries",
        "store_name": "Adonis",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 1.79,
                "name": "Sweet Potatoes",
                "quantity": 2,
                "usedQuantity": 2
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 1.79,
        "priceForRecipe": 1.79,
        "numberOfServings": 2,
        "description": "Crispy baked sweet potato side.",
        "prepMinutes": 10,
        "cookMinutes": 30
    },
    {
        "title": "Simple Carrot Soup",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 2.08,
                "name": "Carrots",
                "quantity": 0.5,
                "usedQuantity": 0.5
            },
            {
                "price": 0,
                "name": "vegetable oil",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 2.08,
        "priceForRecipe": 2.08,
        "numberOfServings": 2,
        "description": "Warm and nutritious vegetable soup.",
        "prepMinutes": 5,
        "cookMinutes": 20
    },
    {
        "title": "Homemade Pancakes",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 0,
                "name": "all-purpose flour",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "granulated sugar",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 0,
        "priceForRecipe": 0,
        "numberOfServings": 2,
        "description": "Classic pantry breakfast.",
        "prepMinutes": 5,
        "cookMinutes": 10
    },
    {
        "title": "Tuna Pasta Salad",
        "store_name": "Walmart",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 6.97,
                "name": "Great Value Tuna",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 0,
                "name": "Catelli Pasta",
                "quantity": 250,
                "usedQuantity": 250
            }
        ],
        "totalPrice": 6.97,
        "priceForRecipe": 6.97,
        "numberOfServings": 2,
        "description": "Cold pasta salad with tuna.",
        "prepMinutes": 5,
        "cookMinutes": 10
    },
    {
        "title": "Rice and Bean Bowl",
        "store_name": "Walmart",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 6.97,
                "name": "Great Value Beans",
                "quantity": 1,
                "usedQuantity": 1
            },
            {
                "price": 10.73,
                "name": "Rice",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 17.7,
        "priceForRecipe": 17.7,
        "numberOfServings": 2,
        "description": "A classic cheap protein-packed meal.",
        "prepMinutes": 2,
        "cookMinutes": 15
    },
    {
        "title": "Pan-seared Sausages with Potatoes",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Fresh Sausages",
                "quantity": 2,
                "usedQuantity": 2
            },
            {
                "price": 5.88,
                "name": "Russet Potatoes",
                "quantity": 2,
                "usedQuantity": 2
            }
        ],
        "totalPrice": 9.87,
        "priceForRecipe": 9.87,
        "numberOfServings": 2,
        "description": "Simple dinner with sausages.",
        "prepMinutes": 5,
        "cookMinutes": 20
    },
    {
        "title": "Steamed Cabbage with Salt",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 3.99,
                "name": "Green Cabbage",
                "quantity": 0.25,
                "usedQuantity": 0.25
            },
            {
                "price": 0,
                "name": "salt",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 3.99,
        "priceForRecipe": 3.99,
        "numberOfServings": 1,
        "description": "Simple, light vegetable dish.",
        "prepMinutes": 2,
        "cookMinutes": 5
    },
    {
        "title": "Sugar Glazed Roasted Carrots",
        "store_name": "Metro",
        "store_lat": 0,
        "store_lon": 0,
        "ingredients": [
            {
                "price": 2.08,
                "name": "Carrots",
                "quantity": 4,
                "usedQuantity": 4
            },
            {
                "price": 0,
                "name": "granulated sugar",
                "quantity": 1,
                "usedQuantity": 1
            }
        ],
        "totalPrice": 2.08,
        "priceForRecipe": 2.08,
        "numberOfServings": 2,
        "description": "Sweet and savory vegetable side.",
        "prepMinutes": 5,
        "cookMinutes": 20
    }
]

export default recipes;