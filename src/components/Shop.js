/**
 * Shop Component
 * Allows users to purchase and equip themes and profile frames
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, Palette, Frame, Coins, Check, Lock, Sparkles, ShoppingCart } from 'lucide-react';
import { getThemeColors } from '../utils/theme';

// Theme definitions with gradients
const THEMES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and minimal',
    gradient: 'from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950',
    cost: 0,
    icon: '🎨',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Calming blue gradients',
    gradient: 'from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900 dark:via-cyan-900 dark:to-blue-950',
    cost: 500,
    icon: '🌊',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm orange and pink tones',
    gradient: 'from-orange-50 via-pink-50 to-red-50 dark:from-orange-900 dark:via-pink-900 dark:to-red-950',
    cost: 500,
    icon: '🌅',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural green shades',
    gradient: 'from-green-50 via-emerald-50 to-teal-50 dark:from-green-900 dark:via-emerald-900 dark:to-teal-950',
    cost: 500,
    icon: '🌲',
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    description: 'Vibrant purple gradients',
    gradient: 'from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-900 dark:via-violet-900 dark:to-fuchsia-950',
    cost: 500,
    icon: '💜',
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    description: 'Luxurious gold tones',
    gradient: 'from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900 dark:via-amber-900 dark:to-orange-950',
    cost: 1000,
    icon: '✨',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Night',
    description: 'Deep space vibes',
    gradient: 'from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950',
    cost: 1500,
    icon: '🌌',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired',
    gradient: 'from-teal-50 via-cyan-50 to-green-50 dark:from-teal-950 dark:via-cyan-950 dark:to-green-950',
    cost: 2000,
    icon: '🌠',
  },
];

// Profile Frame definitions (placeholders)
const PROFILE_FRAMES = [
  {
    id: 'none',
    name: 'No Frame',
    description: 'Default profile appearance',
    cost: 0,
    icon: '⚪',
    preview: '⚪',
  },
  {
    id: 'frame_classic',
    name: 'Classic Frame',
    description: 'Elegant classic border',
    cost: 300,
    icon: '🖼️',
    preview: '🖼️',
  },
  {
    id: 'frame_gold',
    name: 'Golden Frame',
    description: 'Luxurious gold border',
    cost: 500,
    icon: '⭐',
    preview: '⭐',
  },
  {
    id: 'frame_crystal',
    name: 'Crystal Frame',
    description: 'Sparkling crystal border',
    cost: 800,
    icon: '💎',
    preview: '💎',
  },
  {
    id: 'frame_rainbow',
    name: 'Rainbow Frame',
    description: 'Colorful rainbow border',
    cost: 1000,
    icon: '🌈',
    preview: '🌈',
  },
  {
    id: 'frame_star',
    name: 'Starry Frame',
    description: 'Twinkling stars border',
    cost: 1200,
    icon: '✨',
    preview: '✨',
  },
  {
    id: 'frame_crown',
    name: 'Crown Frame',
    description: 'Royal crown border',
    cost: 1500,
    icon: '👑',
    preview: '👑',
  },
  {
    id: 'frame_neon',
    name: 'Neon Frame',
    description: 'Glowing neon border',
    cost: 1800,
    icon: '💡',
    preview: '💡',
  },
  {
    id: 'frame_galaxy',
    name: 'Galaxy Frame',
    description: 'Cosmic galaxy border',
    cost: 2000,
    icon: '🌌',
    preview: '🌌',
  },
];

// Helper function to get favorite food cost based on rarity
const getFavoriteFoodCost = (rarity) => {
  const costs = {
    'Common': 500,
    'Rare': 1000,
    'Epic': 2000,
    'Legendary': 3000,
    'Mythical': 5000,
    'Secret': 10000,
  };
  return costs[rarity] || 500;
};

// Helper function to get pet rarity by species
const getPetRarity = (species) => {
  const petRarities = {
    // Common
    '🐾': 'Common', '🐢': 'Common', '🐱': 'Common', '🐠': 'Common', '🐰': 'Common', '🐦': 'Common',
    // Rare
    '🦊': 'Rare', '🕊️': 'Rare', '🐺': 'Rare', '🦀': 'Rare', '🐧': 'Rare',
    // Epic
    '🦄': 'Epic', '🐲': 'Epic', '🦋': 'Epic', '⚡': 'Epic', '💎': 'Epic',
    // Legendary
    '🐉': 'Legendary', '🔥': 'Legendary', '🦁': 'Legendary', '⭐': 'Legendary',
    // Mythical
    '✨': 'Mythical', '🌌': 'Mythical', '🌠': 'Mythical', '💫': 'Mythical',
    // Secret
    '🌑': 'Secret', '♾️': 'Secret', 'Ω': 'Secret',
  };
  return petRarities[species] || 'Common';
};

// Food items for pets (exported for use in PetSanctuary)
export const FOOD_ITEMS = [
  {
    id: 'basic',
    name: 'Basic Meal',
    icon: '🍎',
    cost: 5,
    hungerReduction: 25,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 60, // minutes
    description: 'A simple, nutritious meal',
  },
  {
    id: 'premium',
    name: 'Premium Feast',
    icon: '🍖',
    cost: 15,
    hungerReduction: 50,
    energyBoost: 25,
    mood: 'Happy',
    moodDuration: 30,
    description: 'A delicious feast that fills your pet',
  },
  {
    id: 'treat',
    name: 'Special Treat',
    icon: '🍪',
    cost: 10,
    hungerReduction: 15,
    energyBoost: 20,
    mood: 'Excited',
    moodDuration: 20,
    description: 'A special treat that boosts energy',
  },
  {
    id: 'super',
    name: 'Super Snack',
    icon: '🍒',
    cost: 20,
    hungerReduction: 40,
    energyBoost: 35,
    mood: 'Ecstatic',
    moodDuration: 15,
    description: 'The ultimate snack for your pet',
  },
  {
    id: 'milk',
    name: 'Milk',
    icon: '🥛',
    cost: 8,
    hungerReduction: 10,
    energyBoost: 5,
    mood: null, // Cleanses mood (sets to Content)
    moodDuration: 0,
    cleansesMood: true,
    description: 'Cleanses negative moods and resets to neutral',
  },
  {
    id: 'junk',
    name: 'Junk Food',
    icon: '🍟',
    cost: 3,
    hungerReduction: 20,
    energyBoost: 5,
    mood: 'Sad',
    moodDuration: 45,
    description: 'Cheap but makes pets sad',
  },
  {
    id: 'spoiled',
    name: 'Spoiled Food',
    icon: '🤢',
    cost: 2,
    hungerReduction: 15,
    energyBoost: 0,
    mood: 'Angry',
    moodDuration: 30,
    description: 'Very cheap but makes pets angry',
  },
  {
    id: 'rotten',
    name: 'Rotten Food',
    icon: '💀',
    cost: 1,
    hungerReduction: 10,
    energyBoost: -5,
    mood: 'Depressed',
    moodDuration: 60,
    description: 'Free but makes pets depressed',
  },
  {
    id: 'fish',
    name: 'Fresh Fish',
    icon: '🐟',
    cost: 12,
    hungerReduction: 35,
    energyBoost: 18,
    mood: 'Happy',
    moodDuration: 40,
    description: 'Fresh catch that pets love',
  },
  {
    id: 'chicken',
    name: 'Grilled Chicken',
    icon: '🍗',
    cost: 18,
    hungerReduction: 45,
    energyBoost: 22,
    mood: 'Happy',
    moodDuration: 35,
    description: 'Tender grilled chicken',
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    icon: '🥗',
    cost: 7,
    hungerReduction: 20,
    energyBoost: 15,
    mood: 'Content',
    moodDuration: 50,
    description: 'Healthy and fresh',
  },
  {
    id: 'sushi',
    name: 'Sushi Platter',
    icon: '🍣',
    cost: 25,
    hungerReduction: 55,
    energyBoost: 30,
    mood: 'Excited',
    moodDuration: 25,
    description: 'Premium sushi selection',
  },
  {
    id: 'pizza',
    name: 'Pizza Slice',
    icon: '🍕',
    cost: 14,
    hungerReduction: 38,
    energyBoost: 20,
    mood: 'Happy',
    moodDuration: 30,
    description: 'Cheesy and delicious',
  },
  {
    id: 'burger',
    name: 'Burger',
    icon: '🍔',
    cost: 16,
    hungerReduction: 42,
    energyBoost: 24,
    mood: 'Happy',
    moodDuration: 32,
    description: 'Juicy burger meal',
  },
  {
    id: 'icecream',
    name: 'Ice Cream',
    icon: '🍨',
    cost: 9,
    hungerReduction: 12,
    energyBoost: 18,
    mood: 'Excited',
    moodDuration: 18,
    description: 'Sweet frozen treat',
  },
  {
    id: 'cake',
    name: 'Birthday Cake',
    icon: '🎂',
    cost: 22,
    hungerReduction: 30,
    energyBoost: 28,
    mood: 'Ecstatic',
    moodDuration: 20,
    description: 'Special celebration cake',
  },
  {
    id: 'honey',
    name: 'Golden Honey',
    icon: '🍯',
    cost: 11,
    hungerReduction: 18,
    energyBoost: 22,
    mood: 'Happy',
    moodDuration: 45,
    description: 'Sweet natural honey',
  },
  {
    id: 'berries',
    name: 'Fresh Berries',
    icon: '🫐',
    cost: 6,
    hungerReduction: 15,
    energyBoost: 14,
    mood: 'Content',
    moodDuration: 55,
    description: 'Fresh and nutritious',
  },
  {
    id: 'steak',
    name: 'Premium Steak',
    icon: '🥩',
    cost: 30,
    hungerReduction: 60,
    energyBoost: 35,
    mood: 'Ecstatic',
    moodDuration: 20,
    description: 'High-quality steak',
  },
  {
    id: 'soup',
    name: 'Warm Soup',
    icon: '🍲',
    cost: 8,
    hungerReduction: 25,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 60,
    description: 'Comforting warm soup',
  },
  {
    id: 'noodles',
    name: 'Ramen Noodles',
    icon: '🍜',
    cost: 13,
    hungerReduction: 40,
    energyBoost: 19,
    mood: 'Happy',
    moodDuration: 38,
    description: 'Hearty noodle dish',
  },
  {
    id: 'taco',
    name: 'Taco',
    icon: '🌮',
    cost: 10,
    hungerReduction: 32,
    energyBoost: 16,
    mood: 'Happy',
    moodDuration: 35,
    description: 'Spicy and flavorful',
  },
  {
    id: 'donut',
    name: 'Donut',
    icon: '🍩',
    cost: 7,
    hungerReduction: 14,
    energyBoost: 16,
    mood: 'Excited',
    moodDuration: 22,
    description: 'Sweet glazed donut',
  },
  {
    id: 'cookie',
    name: 'Cookie',
    icon: '🍪',
    cost: 5,
    hungerReduction: 10,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 40,
    description: 'Simple cookie snack',
  },
  {
    id: 'banana',
    name: 'Banana',
    icon: '🍌',
    cost: 4,
    hungerReduction: 12,
    energyBoost: 10,
    mood: 'Content',
    moodDuration: 50,
    description: 'Natural fruit snack',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    cost: 3,
    hungerReduction: 10,
    energyBoost: 8,
    mood: 'Content',
    moodDuration: 60,
    description: 'Fresh apple',
  },
  {
    id: 'grapes',
    name: 'Grapes',
    icon: '🍇',
    cost: 5,
    hungerReduction: 13,
    energyBoost: 11,
    mood: 'Content',
    moodDuration: 55,
    description: 'Sweet grapes',
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    icon: '🍉',
    cost: 6,
    hungerReduction: 16,
    energyBoost: 13,
    mood: 'Happy',
    moodDuration: 48,
    description: 'Refreshing watermelon',
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    icon: '🍍',
    cost: 7,
    hungerReduction: 18,
    energyBoost: 15,
    mood: 'Happy',
    moodDuration: 45,
    description: 'Tropical pineapple',
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    icon: '🍓',
    cost: 4,
    hungerReduction: 11,
    energyBoost: 9,
    mood: 'Content',
    moodDuration: 58,
    description: 'Sweet strawberries',
  },
  {
    id: 'orange',
    name: 'Orange',
    icon: '🍊',
    cost: 3,
    hungerReduction: 9,
    energyBoost: 7,
    mood: 'Content',
    moodDuration: 60,
    description: 'Fresh orange',
  },
  {
    id: 'peach',
    name: 'Peach',
    icon: '🍑',
    cost: 5,
    hungerReduction: 14,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 52,
    description: 'Juicy peach',
  },
  {
    id: 'cherry',
    name: 'Cherries',
    icon: '🍒',
    cost: 6,
    hungerReduction: 15,
    energyBoost: 13,
    mood: 'Happy',
    moodDuration: 50,
    description: 'Sweet cherries',
  },
  {
    id: 'mango',
    name: 'Mango',
    icon: '🥭',
    cost: 8,
    hungerReduction: 19,
    energyBoost: 17,
    mood: 'Happy',
    moodDuration: 42,
    description: 'Tropical mango',
  },
  {
    id: 'coconut',
    name: 'Coconut',
    icon: '🥥',
    cost: 9,
    hungerReduction: 22,
    energyBoost: 19,
    mood: 'Happy',
    moodDuration: 40,
    description: 'Fresh coconut',
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    icon: '🥝',
    cost: 5,
    hungerReduction: 13,
    energyBoost: 11,
    mood: 'Content',
    moodDuration: 54,
    description: 'Tart kiwi fruit',
  },
  {
    id: 'avocado',
    name: 'Avocado',
    icon: '🥑',
    cost: 10,
    hungerReduction: 24,
    energyBoost: 20,
    mood: 'Happy',
    moodDuration: 38,
    description: 'Creamy avocado',
  },
  {
    id: 'bread',
    name: 'Fresh Bread',
    icon: '🍞',
    cost: 4,
    hungerReduction: 20,
    energyBoost: 8,
    mood: 'Content',
    moodDuration: 60,
    description: 'Warm fresh bread',
  },
  {
    id: 'cheese',
    name: 'Cheese',
    icon: '🧀',
    cost: 8,
    hungerReduction: 25,
    energyBoost: 15,
    mood: 'Happy',
    moodDuration: 45,
    description: 'Rich cheese',
  },
  {
    id: 'egg',
    name: 'Egg',
    icon: '🥚',
    cost: 4,
    hungerReduction: 18,
    energyBoost: 10,
    mood: 'Content',
    moodDuration: 55,
    description: 'Nutritious egg',
  },
  {
    id: 'bacon',
    name: 'Bacon',
    icon: '🥓',
    cost: 12,
    hungerReduction: 30,
    energyBoost: 18,
    mood: 'Happy',
    moodDuration: 35,
    description: 'Crispy bacon',
  },
  {
    id: 'pancake',
    name: 'Pancakes',
    icon: '🥞',
    cost: 11,
    hungerReduction: 28,
    energyBoost: 20,
    mood: 'Happy',
    moodDuration: 40,
    description: 'Fluffy pancakes',
  },
  {
    id: 'waffle',
    name: 'Waffle',
    icon: '🧇',
    cost: 10,
    hungerReduction: 26,
    energyBoost: 18,
    mood: 'Happy',
    moodDuration: 42,
    description: 'Golden waffle',
  },
  {
    id: 'bagel',
    name: 'Bagel',
    icon: '🥯',
    cost: 6,
    hungerReduction: 22,
    energyBoost: 14,
    mood: 'Content',
    moodDuration: 50,
    description: 'Fresh bagel',
  },
  {
    id: 'pretzel',
    name: 'Pretzel',
    icon: '🥨',
    cost: 5,
    hungerReduction: 16,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 48,
    description: 'Salty pretzel',
  },
  {
    id: 'croissant',
    name: 'Croissant',
    icon: '🥐',
    cost: 7,
    hungerReduction: 19,
    energyBoost: 15,
    mood: 'Happy',
    moodDuration: 44,
    description: 'Buttery croissant',
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    icon: '🥪',
    cost: 9,
    hungerReduction: 33,
    energyBoost: 17,
    mood: 'Happy',
    moodDuration: 38,
    description: 'Filling sandwich',
  },
  {
    id: 'hotdog',
    name: 'Hot Dog',
    icon: '🌭',
    cost: 8,
    hungerReduction: 29,
    energyBoost: 16,
    mood: 'Happy',
    moodDuration: 36,
    description: 'Classic hot dog',
  },
  {
    id: 'popcorn',
    name: 'Popcorn',
    icon: '🍿',
    cost: 4,
    hungerReduction: 8,
    energyBoost: 10,
    mood: 'Content',
    moodDuration: 35,
    description: 'Light snack',
  },
  {
    id: 'chips',
    name: 'Chips',
    icon: '🍟',
    cost: 5,
    hungerReduction: 12,
    energyBoost: 8,
    mood: 'Sad',
    moodDuration: 30,
    description: 'Salty chips',
  },
  {
    id: 'candy',
    name: 'Candy',
    icon: '🍬',
    cost: 3,
    hungerReduction: 5,
    energyBoost: 15,
    mood: 'Excited',
    moodDuration: 15,
    description: 'Sweet candy',
  },
  {
    id: 'lollipop',
    name: 'Lollipop',
    icon: '🍭',
    cost: 4,
    hungerReduction: 6,
    energyBoost: 16,
    mood: 'Excited',
    moodDuration: 18,
    description: 'Colorful lollipop',
  },
  {
    id: 'chocolate',
    name: 'Chocolate',
    icon: '🍫',
    cost: 6,
    hungerReduction: 10,
    energyBoost: 19,
    mood: 'Excited',
    moodDuration: 20,
    description: 'Rich chocolate',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: '☕',
    cost: 5,
    hungerReduction: 5,
    energyBoost: 25,
    mood: 'Excited',
    moodDuration: 25,
    description: 'Energizing coffee',
  },
  {
    id: 'tea',
    name: 'Tea',
    icon: '🫖',
    cost: 4,
    hungerReduction: 8,
    energyBoost: 18,
    mood: 'Content',
    moodDuration: 50,
    description: 'Calming tea',
  },
  {
    id: 'juice',
    name: 'Fruit Juice',
    icon: '🧃',
    cost: 5,
    hungerReduction: 12,
    energyBoost: 14,
    mood: 'Content',
    moodDuration: 45,
    description: 'Refreshing juice',
  },
  {
    id: 'smoothie',
    name: 'Smoothie',
    icon: '🥤',
    cost: 8,
    hungerReduction: 15,
    energyBoost: 22,
    mood: 'Happy',
    moodDuration: 40,
    description: 'Healthy smoothie',
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    icon: '🥛',
    cost: 6,
    hungerReduction: 17,
    energyBoost: 13,
    mood: 'Content',
    moodDuration: 55,
    description: 'Creamy yogurt',
  },
  {
    id: 'cereal',
    name: 'Cereal',
    icon: '🥣',
    cost: 5,
    hungerReduction: 21,
    energyBoost: 11,
    mood: 'Content',
    moodDuration: 60,
    description: 'Breakfast cereal',
  },
  {
    id: 'rice',
    name: 'Rice Bowl',
    icon: '🍚',
    cost: 7,
    hungerReduction: 27,
    energyBoost: 14,
    mood: 'Content',
    moodDuration: 58,
    description: 'Steamed rice',
  },
  {
    id: 'dumpling',
    name: 'Dumplings',
    icon: '🥟',
    cost: 11,
    hungerReduction: 36,
    energyBoost: 21,
    mood: 'Happy',
    moodDuration: 33,
    description: 'Steamed dumplings',
  },
  {
    id: 'fortune',
    name: 'Fortune Cookie',
    icon: '🥠',
    cost: 3,
    hungerReduction: 7,
    energyBoost: 9,
    mood: 'Content',
    moodDuration: 40,
    description: 'Mysterious cookie',
  },
  {
    id: 'tamale',
    name: 'Tamale',
    icon: '🫔',
    cost: 9,
    hungerReduction: 31,
    energyBoost: 17,
    mood: 'Happy',
    moodDuration: 37,
    description: 'Traditional tamale',
  },
  {
    id: 'falafel',
    name: 'Falafel',
    icon: '🧆',
    cost: 8,
    hungerReduction: 28,
    energyBoost: 16,
    mood: 'Happy',
    moodDuration: 39,
    description: 'Crispy falafel',
  },
  {
    id: 'flatbread',
    name: 'Flatbread',
    icon: '🫓',
    cost: 6,
    hungerReduction: 23,
    energyBoost: 13,
    mood: 'Content',
    moodDuration: 52,
    description: 'Soft flatbread',
  },
  {
    id: 'olive',
    name: 'Olives',
    icon: '🫒',
    cost: 5,
    hungerReduction: 14,
    energyBoost: 11,
    mood: 'Content',
    moodDuration: 56,
    description: 'Briney olives',
  },
  {
    id: 'bellpepper',
    name: 'Bell Pepper',
    icon: '🫑',
    cost: 4,
    hungerReduction: 11,
    energyBoost: 9,
    mood: 'Content',
    moodDuration: 60,
    description: 'Fresh bell pepper',
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    icon: '🥒',
    cost: 3,
    hungerReduction: 9,
    energyBoost: 7,
    mood: 'Content',
    moodDuration: 60,
    description: 'Cool cucumber',
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    icon: '🥦',
    cost: 4,
    hungerReduction: 12,
    energyBoost: 10,
    mood: 'Content',
    moodDuration: 58,
    description: 'Nutritious broccoli',
  },
  {
    id: 'corn',
    name: 'Corn',
    icon: '🌽',
    cost: 4,
    hungerReduction: 13,
    energyBoost: 11,
    mood: 'Content',
    moodDuration: 57,
    description: 'Sweet corn',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    icon: '🥕',
    cost: 3,
    hungerReduction: 10,
    energyBoost: 8,
    mood: 'Content',
    moodDuration: 60,
    description: 'Crunchy carrot',
  },
  {
    id: 'potato',
    name: 'Potato',
    icon: '🥔',
    cost: 3,
    hungerReduction: 11,
    energyBoost: 9,
    mood: 'Content',
    moodDuration: 59,
    description: 'Simple potato',
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    icon: '🍄',
    cost: 5,
    hungerReduction: 14,
    energyBoost: 12,
    mood: 'Content',
    moodDuration: 56,
    description: 'Earthy mushroom',
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    icon: '🥜',
    cost: 4,
    hungerReduction: 12,
    energyBoost: 13,
    mood: 'Content',
    moodDuration: 54,
    description: 'Roasted peanuts',
  },
  {
    id: 'crab',
    name: 'Crab',
    icon: '🦀',
    cost: 20,
    hungerReduction: 50,
    energyBoost: 28,
    mood: 'Excited',
    moodDuration: 28,
    description: 'Fresh crab meat',
  },
  {
    id: 'lobster',
    name: 'Lobster',
    icon: '🦞',
    cost: 35,
    hungerReduction: 65,
    energyBoost: 38,
    mood: 'Ecstatic',
    moodDuration: 18,
    description: 'Premium lobster',
  },
  {
    id: 'shrimp',
    name: 'Shrimp',
    icon: '🦐',
    cost: 15,
    hungerReduction: 40,
    energyBoost: 24,
    mood: 'Happy',
    moodDuration: 32,
    description: 'Succulent shrimp',
  },
  {
    id: 'squid',
    name: 'Squid',
    icon: '🦑',
    cost: 18,
    hungerReduction: 43,
    energyBoost: 26,
    mood: 'Happy',
    moodDuration: 30,
    description: 'Tender squid',
  },
  {
    id: 'oyster',
    name: 'Oyster',
    icon: '🦪',
    cost: 22,
    hungerReduction: 48,
    energyBoost: 30,
    mood: 'Excited',
    moodDuration: 26,
    description: 'Fresh oyster',
  },
  // Favorite foods for each pet (expensive, gives insane buffs)
  // Common pets (500 coins)
  {
    id: 'pixel_favorite',
    name: 'Digital Energy Cube',
    icon: '🎮',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐾',
    description: 'A digital energy cube that makes Pixel\'s pixels glow with pure joy!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'pebble_favorite',
    name: 'Smooth River Stone',
    icon: '🪨',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐢',
    description: 'A perfectly smooth river stone that Pebble loves to nibble on slowly.',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'whiskers_favorite',
    name: 'Fresh Salmon Delight',
    icon: '🐟',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐱',
    description: 'Fresh salmon that makes Whiskers purr with delight and stretch contentedly.',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'bubbles_favorite',
    name: 'Premium Algae Flakes',
    icon: '🫧',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐠',
    description: 'Premium algae flakes that make Bubbles swim in joyful circles!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'fluffy_favorite',
    name: 'Golden Carrot',
    icon: '🥕',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐰',
    description: 'A golden carrot so sweet it makes Fluffy\'s nose twitch with excitement!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'chirpy_favorite',
    name: 'Sunflower Seed Medley',
    icon: '🌾',
    cost: getFavoriteFoodCost('Common'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐦',
    description: 'Sunflower seeds that make Chirpy sing the most beautiful melodies!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  // Rare pets (1000 coins)
  {
    id: 'blossom_favorite',
    name: 'Cherry Blossom Petals',
    icon: '🌸',
    cost: getFavoriteFoodCost('Rare'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🦊',
    description: 'Cherry blossoms that make Blossom\'s tail wag with pure happiness!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'starling_favorite',
    name: 'Stardust Berries',
    icon: '⭐',
    cost: getFavoriteFoodCost('Rare'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🕊️',
    description: 'Stardust berries that make Starling\'s feathers shimmer with celestial light!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'shadow_favorite',
    name: 'Moonlit Feast',
    icon: '🌙',
    cost: getFavoriteFoodCost('Rare'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐺',
    description: 'Moonlit meat that makes Shadow howl with joy under the night sky!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'coral_favorite',
    name: 'Ocean Gem Crystals',
    icon: '🪸',
    cost: getFavoriteFoodCost('Rare'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🦀',
    description: 'Ocean gems that make Coral\'s shell glow with vibrant underwater colors!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'frost_favorite',
    name: 'Ice Crystal Shards',
    icon: '❄️',
    cost: getFavoriteFoodCost('Rare'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐧',
    description: 'Ice crystals that make Frost waddle with pure delight in the snow!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  // Epic pets (2000 coins)
  {
    id: 'nimbus_favorite',
    name: 'Rainbow Cloud Candy',
    icon: '☁️',
    cost: getFavoriteFoodCost('Epic'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🦄',
    description: 'Rainbow clouds that make Nimbus prance through the sky with magical grace!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'ember_favorite',
    name: 'Molten Lava Gems',
    icon: '🔥',
    cost: getFavoriteFoodCost('Epic'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐲',
    description: 'Molten lava gems that make Ember\'s scales shimmer with fiery intensity!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'aurora_favorite',
    name: 'Northern Light Nectar',
    icon: '🌌',
    cost: getFavoriteFoodCost('Epic'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🦋',
    description: 'Northern light nectar that makes Aurora\'s wings dance with ethereal beauty!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'thunder_favorite',
    name: 'Lightning Bolt Energy',
    icon: '⚡',
    cost: getFavoriteFoodCost('Epic'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '⚡',
    description: 'Lightning bolts that make Thunder crackle with electric excitement!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'crystal_favorite',
    name: 'Prismatic Gem Cluster',
    icon: '💎',
    cost: getFavoriteFoodCost('Epic'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '💎',
    description: 'Prismatic gems that make Crystal refract light into a thousand rainbows!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  // Legendary pets (3000 coins)
  {
    id: 'lumen_favorite',
    name: 'Sunlight Essence',
    icon: '💡',
    cost: getFavoriteFoodCost('Legendary'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🐉',
    description: 'Sunlight essence that makes Lumen\'s golden scales radiate divine brilliance!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'phoenix_favorite',
    name: 'Eternal Flame Core',
    icon: '🔥',
    cost: getFavoriteFoodCost('Legendary'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🔥',
    description: 'Eternal flames that make Phoenix rise with renewed vigor and passion!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'titan_favorite',
    name: 'Royal Feast Platter',
    icon: '👑',
    cost: getFavoriteFoodCost('Legendary'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🦁',
    description: 'Royal feast that makes Titan roar with majestic pride and strength!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'nova_favorite',
    name: 'Stellar Energy Core',
    icon: '⭐',
    cost: getFavoriteFoodCost('Legendary'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '⭐',
    description: 'Stellar energy that makes Nova explode with cosmic joy and radiance!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  // Mythical pets (5000 coins)
  {
    id: 'aether_favorite',
    name: 'Ethereal Stardust',
    icon: '✨',
    cost: getFavoriteFoodCost('Mythical'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '✨',
    description: 'Ethereal stardust that makes Aether transcend reality with pure magic!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'void_favorite',
    name: 'Dark Matter Fragment',
    icon: '🌌',
    cost: getFavoriteFoodCost('Mythical'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🌌',
    description: 'Dark matter that makes Void swirl with infinite mystery and power!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'cosmos_favorite',
    name: 'Galactic Dust Cloud',
    icon: '🌠',
    cost: getFavoriteFoodCost('Mythical'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🌠',
    description: 'Galactic dust that makes Cosmos shimmer with the beauty of the universe!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'eternal_favorite',
    name: 'Timeless Essence',
    icon: '💫',
    cost: getFavoriteFoodCost('Mythical'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '💫',
    description: 'Timeless essence that makes Eternal glow with everlasting radiance!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  // Secret pets (10000 coins)
  {
    id: 'eclipse_favorite',
    name: 'Shadow Essence Orb',
    icon: '🌑',
    cost: getFavoriteFoodCost('Secret'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '🌑',
    description: 'Shadow essence that makes Eclipse merge light and darkness in perfect harmony!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'infinity_favorite',
    name: 'Infinite Possibility',
    icon: '♾️',
    cost: getFavoriteFoodCost('Secret'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: '♾️',
    description: 'Infinite possibilities that make Infinity exist beyond all boundaries!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
  {
    id: 'omega_favorite',
    name: 'The Ultimate Source',
    icon: 'Ω',
    cost: getFavoriteFoodCost('Secret'),
    hungerReduction: 100,
    energyBoost: 100,
    mood: 'Ecstatic',
    moodDuration: 30,
    isFavorite: true,
    petSpecies: 'Ω',
    description: 'The ultimate source that makes Omega transcend all existence itself!',
    specialBuffs: {
      expBoost: 500,
      infiniteEnergy: true,
      infiniteHunger: true,
      duration: 10,
    },
  },
];

const Shop = () => {
  const { gamification, buyTheme, buyProfileFrame, equipTheme, equipProfileFrame, unequipProfileFrame, buyFood, getFoodCost, activeTab: appActiveTab } = useApp();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('themes');
  const [foodSubTab, setFoodSubTab] = useState('regular');
  
  // If navigating from pet sanctuary (when shop tab becomes active), default to food tab
  useEffect(() => {
    if (appActiveTab === 'shop' && activeTab === 'themes') {
      // Check if we should default to food tab (could be enhanced with state/context)
      const shouldShowFood = sessionStorage.getItem('showFoodTab') === 'true';
      if (shouldShowFood) {
        setActiveTab('food');
        sessionStorage.removeItem('showFoodTab');
      }
    }
  }, [appActiveTab, activeTab]);
  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  const handleBuyTheme = (theme) => {
    const result = buyTheme(theme);
    if (result.success) {
      success(result.message);
    } else {
      error(result.message);
    }
  };

  const handleEquipTheme = (themeId) => {
    equipTheme(themeId);
    success('Theme equipped!');
  };

  const handleBuyFrame = (frame) => {
    const result = buyProfileFrame(frame);
    if (result.success) {
      success(result.message);
    } else {
      error(result.message);
    }
  };

  const handleEquipFrame = (frameId) => {
    if (frameId === 'none') {
      unequipProfileFrame();
      success('Profile frame removed!');
    } else {
      equipProfileFrame(frameId);
      success('Profile frame equipped!');
    }
  };

  const handleBuyFood = (foodItem) => {
    const result = buyFood(foodItem);
    result.success ? success(result.message) : error(result.message);
  };

  const unlockedThemes = gamification.unlockedThemes || ['default'];
  const unlockedFrames = gamification.unlockedProfileFrames || [];
  const currentFrame = gamification.currentProfileFrame || null;

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className={themeColors.iconColor} size={28} />
            Shop
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your experience with themes and profile frames
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-gray-800/80 px-4 py-2 shadow">
          <Coins className="text-yellow-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {gamification.coins} Coins
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('themes')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'themes'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Palette size={18} />
            Themes
          </div>
        </button>
        <button
          onClick={() => setActiveTab('frames')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'frames'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Frame size={18} />
            Profile Frames
          </div>
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'food'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            Pet Food
          </div>
        </button>
      </div>

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isEquipped = currentTheme === theme.id;
            const canAfford = gamification.coins >= theme.cost;

            return (
              <div
                key={theme.id}
                className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1 ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Theme Preview */}
                <div className={`h-32 rounded-xl mb-4 bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-4xl shadow-inner`}>
                  {theme.icon}
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {theme.name}
                      {isEquipped && (
                        <span 
                          className="text-xs px-2 py-1 text-white rounded-full"
                          style={{ backgroundColor: 'var(--theme-icon-color)' }}
                        >
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {theme.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Coins className="text-yellow-500" size={16} />
                      {theme.cost === 0 ? 'Free' : `${theme.cost} coins`}
                    </div>
                    {isUnlocked ? (
                      <div className="flex gap-2">
                        {!isEquipped && (
                          <button
                            onClick={() => handleEquipTheme(theme.id)}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <Sparkles size={14} />
                            Equip
                          </button>
                        )}
                        {isEquipped && (
                          <button
                            disabled
                            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <Check size={14} />
                            Equipped
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyTheme(theme)}
                        disabled={!canAfford}
                        className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                          !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingBag size={14} />
                            Buy
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            Locked
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Frames Tab */}
      {activeTab === 'frames' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROFILE_FRAMES.map((frame) => {
            const isUnlocked = frame.id === 'none' || unlockedFrames.includes(frame.id);
            const isEquipped = (frame.id === 'none' && !currentFrame) || currentFrame === frame.id;
            const canAfford = gamification.coins >= frame.cost;

            return (
              <div
                key={frame.id}
                className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1 ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Frame Preview */}
                <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-6xl shadow-inner border-4 border-gray-300 dark:border-gray-600">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                    style={{
                      background: `linear-gradient(to bottom right, var(--theme-color-via), var(--theme-color-to))`
                    }}
                  >
                    👤
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {frame.name}
                      {isEquipped && (
                        <span 
                          className="text-xs px-2 py-1 text-white rounded-full"
                          style={{ backgroundColor: 'var(--theme-icon-color)' }}
                        >
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {frame.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Coins className="text-yellow-500" size={16} />
                      {frame.cost === 0 ? 'Free' : `${frame.cost} coins`}
                    </div>
                    {isUnlocked ? (
                      <div className="flex gap-2">
                        {!isEquipped && (
                          <button
                            onClick={() => handleEquipFrame(frame.id)}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <Sparkles size={14} />
                            Equip
                          </button>
                        )}
                        {isEquipped && (
                          <button
                            disabled
                            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <Check size={14} />
                            Equipped
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyFrame(frame)}
                        disabled={!canAfford}
                        className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                          !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingBag size={14} />
                            Buy
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            Locked
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Food Tab */}
      {activeTab === 'food' && (() => {
        const regularFoods = FOOD_ITEMS.filter(food => !food.isFavorite);
        const favoriteFoods = FOOD_ITEMS.filter(food => food.isFavorite);

        return (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFoodSubTab('regular')}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                  foodSubTab === 'regular'
                    ? 'border-theme text-theme'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Regular Food
              </button>
              <button
                onClick={() => setFoodSubTab('favorite')}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                  foodSubTab === 'favorite'
                    ? 'border-theme text-theme'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Favorite Foods
              </button>
            </div>

            {/* Regular Foods */}
            {foodSubTab === 'regular' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularFoods.map((food) => {
                  const canAfford = gamification.coins >= (getFoodCost ? getFoodCost(food.cost) : food.cost);
                  const finalCost = getFoodCost ? getFoodCost(food.cost) : food.cost;
                  const moodInfo = food.mood ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Mood: <span className="font-medium">{food.mood}</span>
                      {food.moodDuration > 0 && ` (${food.moodDuration}m)`}
                    </div>
                  ) : food.cleansesMood ? (
                    <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                      Cleanses mood
                    </div>
                  ) : null;

                  return (
                    <div
                      key={food.id}
                      className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1`}
                    >
                      {/* Food Preview */}
                      <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-6xl shadow-inner">
                        {food.icon}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {food.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {food.description}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Hunger:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              -{food.hungerReduction}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Energy:</span>
                            <span className={`font-medium ${food.energyBoost >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {food.energyBoost >= 0 ? '+' : ''}{food.energyBoost}%
                            </span>
                          </div>
                          {moodInfo}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Coins className="text-yellow-500" size={16} />
                            {finalCost} coins
                            {getFoodCost && finalCost !== food.cost && (
                              <span className="text-xs opacity-75 line-through ml-1">{food.cost}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuyFood(food)}
                            disabled={!canAfford}
                            className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                              !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {canAfford ? (
                              <>
                                <ShoppingBag size={14} />
                                Buy
                              </>
                            ) : (
                              <>
                                <Lock size={14} />
                                Locked
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Favorite Foods */}
            {foodSubTab === 'favorite' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteFoods.map((food) => {
                  const canAfford = gamification.coins >= (getFoodCost ? getFoodCost(food.cost) : food.cost);
                  const finalCost = getFoodCost ? getFoodCost(food.cost) : food.cost;

                  return (
                    <div
                      key={food.id}
                      className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1`}
                    >
                      {/* Food Preview */}
                      <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center text-6xl shadow-inner">
                        {food.icon}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {food.name}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                              Favorite
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {food.description}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                            For: {food.petSpecies} pets
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Hunger:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              -{food.hungerReduction}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Energy:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              +{food.energyBoost}%
                            </span>
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 pt-1 border-t border-gray-200 dark:border-gray-700">
                            <div className="font-medium mb-1">Special Buffs:</div>
                            <div>+{food.specialBuffs.expBoost}% EXP</div>
                            <div>Infinite Energy & Hunger</div>
                            <div>Duration: {food.specialBuffs.duration} minutes</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Coins className="text-yellow-500" size={16} />
                            {finalCost} coins
                            {getFoodCost && finalCost !== food.cost && (
                              <span className="text-xs opacity-75 line-through ml-1">{food.cost}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuyFood(food)}
                            disabled={!canAfford}
                            className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                              !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {canAfford ? (
                              <>
                                <ShoppingBag size={14} />
                                Buy
                              </>
                            ) : (
                              <>
                                <Lock size={14} />
                                Locked
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default Shop;

