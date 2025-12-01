/**
 * Pet Sanctuary Component
 * Dedicated page for virtual pet collection and spins
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { getThemeColors } from '../utils/theme';
import {
  PawPrint,
  Coins,
  Sparkles,
  Wand2,
  Gift,
  RefreshCcw,
  Heart,
  Bone,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Star,
  Backpack,
  X,
  Plus,
  Search,
  ArrowUpDown,
  Trash2,
  Settings,
  Info,
} from 'lucide-react';
import { FOOD_ITEMS } from './Shop';

const rarityStyles = {
  Common: 'text-gray-500 bg-gray-100 dark:bg-gray-800/60',
  Rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  Epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40',
  Legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  Mythical: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  Secret: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600',
};

const rarityChances = [
  { rarity: 'Secret', chance: 0.5, color: 'text-orange-500' },
  { rarity: 'Mythical', chance: 3.5, color: 'text-pink-500' },
  { rarity: 'Legendary', chance: 5, color: 'text-yellow-500' },
  { rarity: 'Epic', chance: 18, color: 'text-purple-500' },
  { rarity: 'Rare', chance: 30, color: 'text-blue-500' },
  { rarity: 'Common', chance: 43, color: 'text-gray-500' },
];

const rarityOrder = {
  'Secret': 0,
  'Mythical': 1,
  'Legendary': 2,
  'Epic': 3,
  'Rare': 4,
  'Common': 5,
};

const SPIN_COST = 150;
const PITY_THRESHOLD = 10;

// Helper function to scale buffs/debuffs for level (same as in AppContext)
const scaleBuffsForLevel = (buffs, level) => {
  if (!buffs || level <= 1) return buffs || {};
  const multiplier = Math.min(1 + (level - 1) * 0.02, 2);
  const scaled = {};
  for (const [key, value] of Object.entries(buffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

const scaleDebuffsForLevel = (debuffs, level) => {
  if (!debuffs || level <= 1) return debuffs || {};
  const multiplier = Math.max(1 - (level - 1) * 0.01, 0.5);
  const scaled = {};
  for (const [key, value] of Object.entries(debuffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

// Helper to calculate combined buffs from all equipped pets
const getCombinedBuffs = (equippedPets) => {
  const combinedBuffs = {
    xpBoost: 0,
    coinBoost: 0,
  };
  const combinedDebuffs = {
    xpPenalty: 0,
    coinPenalty: 0,
    priceIncrease: 0,
    luckPenalty: 0,
  };

  equippedPets.forEach(pet => {
    const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
    const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
    
    combinedBuffs.xpBoost += scaledBuffs.xpBoost || 0;
    combinedBuffs.coinBoost += scaledBuffs.coinBoost || 0;
    
    combinedDebuffs.xpPenalty += scaledDebuffs.xpPenalty || 0;
    combinedDebuffs.coinPenalty += scaledDebuffs.coinPenalty || 0;
    combinedDebuffs.priceIncrease += scaledDebuffs.priceIncrease || 0;
    combinedDebuffs.luckPenalty += scaledDebuffs.luckPenalty || 0;
  });

  return { buffs: combinedBuffs, debuffs: combinedDebuffs };
};

const PetSanctuary = () => {
  const { gamification, spinForPet, feedPet, playWithPet, equipPet, unequipPet, deletePet, getFoodCost, getSpinCost, setActiveTab } = useApp();
  const { success, error } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryTab, setInventoryTab] = useState('pets'); // 'pets' or 'food'
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [petSearchQuery, setPetSearchQuery] = useState('');
  const [petSortBy, setPetSortBy] = useState('rarity');
  const [isSpinning10, setIsSpinning10] = useState(false);
  const [selectedPets, setSelectedPets] = useState(new Set());
  const [isMassDeleteMode, setIsMassDeleteMode] = useState(false);
  const [autoDeleteRarities, setAutoDeleteRarities] = useState(new Set(['Common']));
  const [showAutoDeleteSettings, setShowAutoDeleteSettings] = useState(false);
  const [showPetInfo, setShowPetInfo] = useState(false);

  const petInventory = gamification.petInventory || [];
  const equippedPets = useMemo(() => {
    return (gamification.equippedPets || [])
      .map(id => petInventory.find(p => p.id === id))
      .filter(Boolean);
  }, [gamification.equippedPets, petInventory]);

  const sortedAndFilteredPets = useMemo(() => {
    const equippedIds = new Set(gamification.equippedPets || []);
    let filtered = petInventory;
    
    if (petSearchQuery) {
      const query = petSearchQuery.toLowerCase();
      filtered = filtered.filter(pet => 
        pet.name.toLowerCase().includes(query) ||
        pet.rarity.toLowerCase().includes(query) ||
        (pet.species || '').includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      const aEquipped = equippedIds.has(a.id);
      const bEquipped = equippedIds.has(b.id);
      
      if (aEquipped && !bEquipped) return -1;
      if (!aEquipped && bEquipped) return 1;
      
      if (petSortBy === 'rarity') {
        return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
      } else if (petSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (petSortBy === 'level') {
        return (b.level || 1) - (a.level || 1);
      }
      return 0;
    });
    
    return sorted;
  }, [petInventory, petSearchQuery, petSortBy, gamification.equippedPets]);

  const combinedEffects = useMemo(() => getCombinedBuffs(equippedPets), [equippedPets]);

  const handleSpin = () => {
    if (isSpinning || isSpinning10) return;
    const spinCost = getSpinCost ? getSpinCost() : SPIN_COST;
    if (gamification.coins < spinCost) {
      error(`You need ${spinCost} coins to spin.`);
      return;
    }
    setIsSpinning(true);
    setTimeout(() => {
      const result = spinForPet();
      if (result.success) {
        setLastReward(result.reward);
        const newPet = result.reward;
        
        // Auto-delete if rarity is in auto-delete list (but not if equipped)
        const equippedIds = new Set(gamification.equippedPets || []);
        if (autoDeleteRarities.has(newPet.rarity) && !equippedIds.has(newPet.id)) {
          setTimeout(() => {
            deletePet(newPet.id);
            const wasPityUsed = (gamification.pityCounter || 0) >= PITY_THRESHOLD;
            if (wasPityUsed) {
              success(`Pity system activated! Got ${newPet.name} (${newPet.rarity}) but it was auto-deleted.`);
            } else {
              success(`Got ${newPet.name} (${newPet.rarity}) but it was auto-deleted.`);
            }
          }, 200);
        } else {
          const wasPityUsed = (gamification.pityCounter || 0) >= PITY_THRESHOLD;
          if (wasPityUsed) {
            success(`Pity system activated! Guaranteed rare+ pet! You got ${newPet.name}!`);
          } else {
            success(`You got ${newPet.name}! Check your inventory.`);
          }
          setInventoryTab('pets');
          setShowInventory(true);
        }
      } else {
        error(result.message);
      }
      setIsSpinning(false);
    }, 1200);
  };

  const handleSpin10 = async () => {
    if (isSpinning || isSpinning10) return;
    const spinCost = getSpinCost ? getSpinCost() : SPIN_COST;
    const totalCost = spinCost * 10;
    if (gamification.coins < totalCost) {
      error(`You need ${totalCost} coins to spin 10 times.`);
      return;
    }
    setIsSpinning10(true);
    const rewards = [];
    const petIdsToDelete = [];
    const equippedIds = new Set(gamification.equippedPets || []);
    
    try {
      for (let i = 0; i < 10; i++) {
        const result = spinForPet();
        if (result.success && result.reward) {
          const newPet = result.reward;
          rewards.push(newPet);
          
          // Mark for auto-delete if rarity matches (but not if equipped)
          if (autoDeleteRarities.has(newPet.rarity) && !equippedIds.has(newPet.id)) {
            petIdsToDelete.push(newPet.id);
          }
        }
        if (i < 9) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Auto-delete after all spins complete
      if (petIdsToDelete.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        deletePet(petIdsToDelete);
      }
      
      const keptPets = rewards.filter(r => r && (!autoDeleteRarities.has(r.rarity) || equippedIds.has(r.id)));
      const rareCount = keptPets.filter(r => r && ['Rare', 'Epic', 'Legendary', 'Mythical', 'Secret'].includes(r.rarity)).length;
      
      let message = `Spun 10 times! Got ${rewards.length} pets`;
      if (petIdsToDelete.length > 0) {
        message += ` (${petIdsToDelete.length} auto-deleted, ${keptPets.length} kept)`;
      }
      message += ` - ${rareCount} rare+ kept. Check your inventory!`;
      success(message);
      setInventoryTab('pets');
      setShowInventory(true);
    } catch (err) {
      error('Error during spin 10: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSpinning10(false);
    }
  };

  const inventory = gamification.inventory || {};
  const hasFood = Object.keys(inventory).some(id => (inventory[id] || 0) > 0);

  const openFeedModal = (petId, foodId = null) => {
    if (!petId) {
      error('Please select a pet to feed.');
      return;
    }
    
    if (!hasFood) {
      setSelectedPetId(petId);
      setShowFeedModal(true);
      return;
    }

    const availableFood = FOOD_ITEMS.find(food => {
      const qty = inventory[food.id] || 0;
      return qty > 0;
    });

    const initialFoodId = foodId && (inventory[foodId] || 0) > 0 ? foodId : availableFood?.id;
    if (!initialFoodId) {
      setSelectedPetId(petId);
      setShowFeedModal(true);
      return;
    }

    setSelectedPetId(petId);
    setSelectedFoodId(initialFoodId);
    setSelectedQuantity(1);
    setShowFeedModal(true);
  };

  const handleConfirmFeed = () => {
    if (!selectedPetId || !selectedFoodId) return;
    const available = inventory[selectedFoodId] || 0;
    if (available <= 0) {
      error('You do not have this food in your inventory.');
      return;
    }
    const quantity = Math.max(1, Math.min(selectedQuantity || 1, available));
    const result = feedPet(selectedPetId, selectedFoodId, quantity);
    if (result.success) {
      success(result.message);
      setShowFeedModal(false);
      setSelectedPetId(null);
    } else {
      error(result.message);
    }
  };

  const handlePlay = (petId) => {
    if (!petId) {
      error('Please select a pet to play with.');
      return;
    }
    const pet = petInventory.find(p => p.id === petId);
    if (!pet) {
      error('Pet not found.');
      return;
    }
    const result = playWithPet(petId);
    result.success ? success(result.message) : error(result.message);
  };

  const handleEquipPet = (petId) => {
    if (equippedPets.length >= 3) {
      error('You can only equip up to 3 pets at a time.');
      return;
    }
    equipPet(petId);
    success('Pet equipped!');
  };

  const handleUnequipPet = (petId) => {
    unequipPet(petId);
    success('Pet unequipped!');
  };

  const handleDeletePet = (petId) => {
    const pet = petInventory.find(p => p.id === petId);
    if (!pet) return;
    
    const isEquipped = equippedPets.some(ep => ep.id === petId);
    if (isEquipped) {
      error('Please unequip the pet before deleting it.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`)) {
      deletePet(petId);
      success(`${pet.name} has been deleted.`);
      setSelectedPets(new Set());
    }
  };

  const handleTogglePetSelection = (petId) => {
    const isEquipped = equippedPets.some(ep => ep.id === petId);
    if (isEquipped) {
      error('Cannot select equipped pets. Please unequip them first.');
      return;
    }
    
    const newSelected = new Set(selectedPets);
    if (newSelected.has(petId)) {
      newSelected.delete(petId);
    } else {
      newSelected.add(petId);
    }
    setSelectedPets(newSelected);
  };

  const handleSelectAll = () => {
    const equippedIds = new Set(gamification.equippedPets || []);
    const unEquippedPets = sortedAndFilteredPets.filter(p => !equippedIds.has(p.id));
    
    if (selectedPets.size === unEquippedPets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(unEquippedPets.map(p => p.id)));
    }
  };

  const handleMassDelete = () => {
    if (selectedPets.size === 0) return;
    
    const petsToDelete = sortedAndFilteredPets.filter(p => selectedPets.has(p.id));
    const equippedToDelete = petsToDelete.filter(p => equippedPets.some(ep => ep.id === p.id));
    
    if (equippedToDelete.length > 0) {
      error(`Cannot delete equipped pets. Please unequip ${equippedToDelete.map(p => p.name).join(', ')} first.`);
      return;
    }
    
    const petNames = petsToDelete.map(p => p.name).join(', ');
    
    if (window.confirm(`Are you sure you want to delete ${selectedPets.size} pet(s)?\n\n${petNames}\n\nThis action cannot be undone.`)) {
      deletePet(Array.from(selectedPets));
      success(`Deleted ${selectedPets.size} pet(s).`);
      setSelectedPets(new Set());
      setIsMassDeleteMode(false);
    }
  };

  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PawPrint className="icon-theme" size={28} />
            Pet Sanctuary
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Collect adorable study buddies and keep them happy! Equip up to 3 pets for combined effects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInventoryTab('pets');
              setShowInventory(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="View Inventory"
          >
            <Backpack className="icon-theme" size={20} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Inventory
              {(petInventory.length > 0 || hasFood) && (
                <span 
                  className="ml-2 px-2 py-0.5 text-white rounded-full text-xs"
                  style={{ backgroundColor: 'var(--theme-icon-color)' }}
                >
                  {petInventory.length + (hasFood ? Object.values(inventory).reduce((sum, qty) => sum + qty, 0) : 0)}
                </span>
              )}
            </span>
          </button>
          <div 
            className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-gray-800/80 px-4 py-2 shadow"
            style={{
              border: '1px solid',
              borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.2)',
            }}
          >
            <Coins className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {gamification.coins} Coins
            </span>
          </div>
        </div>
      </div>

      {/* Equipped Pets Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="icon-theme" size={20} />
            Equipped Pets ({equippedPets.length}/3)
          </h3>
          {equippedPets.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Equip pets from your inventory to activate their effects
            </p>
          )}
        </div>

        {equippedPets.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            <PawPrint className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No pets equipped</p>
            <button
              onClick={() => setShowInventory(true)}
              className="btn-primary inline-flex items-center gap-2 mt-4"
            >
              <Plus size={18} />
              Equip Pets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => {
              const pet = equippedPets[index];
              if (!pet) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]"
                  >
                    <Plus className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Empty Slot</p>
                    <button
                      onClick={() => setShowInventory(true)}
                      className="btn-secondary mt-2 text-xs"
                    >
                      Equip Pet
                    </button>
                  </div>
                );
              }

              const rarityStyle = rarityStyles[pet.rarity] || rarityStyles.Common;
              return (
                <div
                  key={pet.id}
                  className="card p-4 border-2"
                  style={{
                    borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-2xl">
                        {pet.species || '🐾'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{pet.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rarityStyle}`}>
                          {pet.rarity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnequipPet(pet.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Unequip"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Level</p>
                      <p className="font-bold icon-theme">{pet.level || 1}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Mood</p>
                      <p className="font-semibold icon-theme text-xs">{pet.mood}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Energy</span>
                      <span className="font-medium">{pet.energy || 70}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pet.energy || 70}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Hunger</span>
                      <span className="font-medium">{pet.hunger || 30}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pet.hunger || 30}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openFeedModal(pet.id)}
                      disabled={!hasFood}
                      className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                      title={!hasFood ? 'Buy food from shop first!' : 'Feed pet'}
                    >
                      <Bone size={14} />
                      <span>Feed</span>
                    </button>
                    <button
                      onClick={() => handlePlay(pet.id)}
                      disabled={(pet.energy || 0) <= 0}
                      className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                      title={(pet.energy || 0) <= 0 ? 'No energy' : 'Play with pet'}
                    >
                      <Heart size={14} />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Combined Effects */}
        {(combinedEffects.buffs && Object.keys(combinedEffects.buffs).some(k => combinedEffects.buffs[k] > 0)) ||
         (combinedEffects.debuffs && Object.keys(combinedEffects.debuffs).some(k => combinedEffects.debuffs[k] > 0)) ? (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Combined Effects from Equipped Pets
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {combinedEffects.buffs.xpBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                    <TrendingUp size={12} />
                    <span className="font-medium">XP Boost</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">+{combinedEffects.buffs.xpBoost}%</span>
                </div>
              )}
              {combinedEffects.buffs.coinBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                    <DollarSign size={12} />
                    <span className="font-medium">Coin Boost</span>
                  </div>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{combinedEffects.buffs.coinBoost}%</span>
                </div>
              )}
              {combinedEffects.debuffs.xpPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">XP Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.xpPenalty}%</span>
                </div>
              )}
              {combinedEffects.debuffs.coinPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Coin Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.coinPenalty}%</span>
                </div>
              )}
              {combinedEffects.debuffs.priceIncrease > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Price Increase</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">+{combinedEffects.debuffs.priceIncrease}%</span>
                </div>
              )}
              {combinedEffects.debuffs.luckPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Luck Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.luckPenalty}%</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spin Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pet Gacha</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Lucky Spin
                <Sparkles className="icon-theme" size={20} />
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPetInfo(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="Pet Rarity Info"
                style={{
                  color: 'var(--theme-icon-color, rgb(14, 165, 233))',
                }}
              >
                <Info size={20} />
              </button>
              <button
                onClick={() => setShowAutoDeleteSettings(true)}
                className={`relative p-2 rounded-lg hover:bg-opacity-10 dark:hover:bg-opacity-20 transition-colors ${
                  autoDeleteRarities.size > 0
                    ? ''
                    : ''
                }`}
                title={`Auto-delete settings (${autoDeleteRarities.size} rarities selected)`}
                style={{
                  color: autoDeleteRarities.size > 0 
                    ? 'var(--theme-icon-color, rgb(14, 165, 233))' 
                    : 'var(--theme-icon-color, rgb(14, 165, 233))',
                  backgroundColor: autoDeleteRarities.size > 0 
                    ? 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' 
                    : 'transparent',
                }}
              >
                <Settings size={20} />
                {autoDeleteRarities.size > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                    style={{ backgroundColor: 'var(--theme-icon-color, rgb(14, 165, 233))' }}
                  ></span>
                )}
              </button>
            </div>
          </div>

          <div 
            className="h-40 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--theme-color-from, rgb(14, 165, 233)) 0%, var(--theme-color-via, rgb(14, 165, 233)) 50%, var(--theme-color-to, rgb(3, 105, 161)) 100%)`
            }}
          >
            <div className={`text-7xl ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
              {isSpinning ? '🎁' : (equippedPets[0]?.species || '🐾')}
            </div>
            {isSpinning && <div className="absolute inset-0 bg-white/10" />}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</p>
              <p className="font-semibold text-yellow-600 dark:text-yellow-300">
                {getSpinCost ? getSpinCost() : SPIN_COST} coins
                {getSpinCost && getSpinCost() !== SPIN_COST && (
                  <span className="text-xs text-gray-400 ml-1 line-through">{SPIN_COST}</span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pity Counter</p>
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                {(gamification.pityCounter || 0)}/{PITY_THRESHOLD}
                {(gamification.pityCounter || 0) >= PITY_THRESHOLD && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✨</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSpin}
              disabled={isSpinning || isSpinning10 || gamification.coins < (getSpinCost ? getSpinCost() : SPIN_COST)}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSpinning ? (
                <>
                  <RefreshCcw className="animate-spin" size={18} />
                  Spinning...
                </>
              ) : (
                <>
                  <Gift size={18} />
                  Spin for new pet
                </>
              )}
            </button>
            <button
              onClick={handleSpin10}
              disabled={isSpinning || isSpinning10 || gamification.coins < ((getSpinCost ? getSpinCost() : SPIN_COST) * 10)}
              className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSpinning10 ? (
                <>
                  <RefreshCcw className="animate-spin" size={18} />
                  Spinning 10x...
                </>
              ) : (
                <>
                  <Gift size={18} />
                  Spin 10 Times ({(getSpinCost ? getSpinCost() : SPIN_COST) * 10} coins)
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Rarity Chances</p>
            <div className="grid grid-cols-2 gap-2">
              {rarityChances.map((rarity) => (
                <div 
                  key={rarity.rarity} 
                  className="flex items-center justify-between text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded-lg"
                >
                  <span className={`${rarity.color} font-semibold`}>{rarity.rarity}</span>
                  <span className="text-gray-500 dark:text-gray-400">{rarity.chance}%</span>
                </div>
              ))}
            </div>
          </div>


          {lastReward && (
            <div className="rounded-xl border border-dashed p-3 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <Wand2 size={16} className="icon-theme" />
              <span>Recently adopted <span className="font-semibold">{lastReward.name}</span> ({lastReward.rarity})</span>
            </div>
          )}
        </div>

        {/* Quick Stats Card */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="icon-theme" size={20} />
            Collection Stats
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Pets</span>
              <span className="text-lg font-bold icon-theme">{petInventory.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Equipped</span>
              <span className="text-lg font-bold icon-theme">{equippedPets.length}/3</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Common', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Secret'].map(rarity => {
                const count = petInventory.filter(p => p.rarity === rarity).length;
                if (count === 0) return null;
                return (
                  <div key={rarity} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${rarityStyles[rarity] || ''}`}>{rarity}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Backpack className="icon-theme" size={28} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h3>
              </div>
              <button
                onClick={() => setShowInventory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setInventoryTab('pets')}
                className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
                  inventoryTab === 'pets'
                    ? ''
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={{
                  color: inventoryTab === 'pets' ? 'var(--theme-icon-color, rgb(14, 165, 233))' : undefined,
                }}
              >
                <span className="flex items-center gap-2">
                  <PawPrint size={18} />
                  Pets ({petInventory.length})
                </span>
                {inventoryTab === 'pets' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--theme-icon-color, rgb(14, 165, 233))' }} />
                )}
              </button>
              <button
                onClick={() => setInventoryTab('food')}
                className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
                  inventoryTab === 'food'
                    ? ''
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={{
                  color: inventoryTab === 'food' ? 'var(--theme-icon-color, rgb(14, 165, 233))' : undefined,
                }}
              >
                <span className="flex items-center gap-2">
                  <Bone size={18} />
                  Food ({Object.values(inventory).reduce((sum, qty) => sum + qty, 0)})
                </span>
                {inventoryTab === 'food' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--theme-icon-color, rgb(14, 165, 233))' }} />
                )}
              </button>
            </div>

            {/* Pets Section */}
            {inventoryTab === 'pets' && (
              <>
                {petInventory.length === 0 ? (
                  <div className="text-center py-12">
                    <PawPrint className="text-gray-400 mx-auto mb-4" size={64} />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Your pet inventory is empty
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Spin for pets to start your collection!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search pets by name, rarity, or species..."
                          value={petSearchQuery}
                          onChange={(e) => setPetSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={petSortBy}
                          onChange={(e) => setPetSortBy(e.target.value)}
                          className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                          <option value="rarity">Sort by Rarity</option>
                          <option value="name">Sort by Name</option>
                          <option value="level">Sort by Level</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsMassDeleteMode(!isMassDeleteMode);
                            setSelectedPets(new Set());
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isMassDeleteMode
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Trash2 size={16} className="inline mr-1" />
                          {isMassDeleteMode ? 'Cancel' : 'Delete'}
                        </button>
                        {isMassDeleteMode && selectedPets.size > 0 && (
                          <button
                            onClick={handleMassDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete ({selectedPets.size})
                          </button>
                        )}
                      </div>
                    </div>
                    {isMassDeleteMode && (() => {
                      const equippedIds = new Set(gamification.equippedPets || []);
                      const unEquippedPets = sortedAndFilteredPets.filter(p => !equippedIds.has(p.id));
                      const allUnEquippedSelected = unEquippedPets.length > 0 && selectedPets.size === unEquippedPets.length;
                      
                      return (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allUnEquippedSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Select all unequipped ({selectedPets.size} selected)
                            </span>
                          </div>
                          <span className="text-xs text-yellow-700 dark:text-yellow-400">
                            Equipped pets cannot be deleted
                          </span>
                        </div>
                      );
                    })()}
                    {sortedAndFilteredPets.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="text-gray-400 mx-auto mb-4" size={48} />
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                          No pets found
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Try adjusting your search or filter
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedAndFilteredPets.map((pet) => {
                      const isEquipped = equippedPets.some(ep => ep.id === pet.id);
                      const rarityStyle = rarityStyles[pet.rarity] || rarityStyles.Common;
                      
                      const isSelected = selectedPets.has(pet.id);
                      
                      return (
                        <div
                          key={pet.id}
                          className={`card p-4 border-2 ${
                            isSelected
                              ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                              : isEquipped 
                              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              {isMassDeleteMode && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isEquipped}
                                  onChange={() => handleTogglePetSelection(pet.id)}
                                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              )}
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-xl">
                                {pet.species || '🐾'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{pet.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rarityStyle}`}>
                                  {pet.rarity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <p className="text-gray-500 dark:text-gray-400">Level</p>
                              <p className="font-bold">{pet.level || 1}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <p className="text-gray-500 dark:text-gray-400">Mood</p>
                              <p className="font-semibold text-xs">{pet.mood}</p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">Energy</span>
                              <span className="font-medium">{pet.energy || 70}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${pet.energy || 70}%` }}
                              />
                            </div>
                          </div>

                          {!isMassDeleteMode && (
                            <div className="flex gap-2 mt-3">
                              {isEquipped ? (
                                <button
                                  onClick={() => handleUnequipPet(pet.id)}
                                  className="btn-secondary flex-1 text-xs py-1.5"
                                >
                                  Unequip
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEquipPet(pet.id)}
                                  disabled={equippedPets.length >= 3}
                                  className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {equippedPets.length >= 3 ? 'Full' : 'Equip'}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setShowInventory(false);
                                  openFeedModal(pet.id);
                                }}
                                disabled={!hasFood}
                                className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                                title={!hasFood ? 'Buy food first' : 'Feed'}
                              >
                                <Bone size={14} />
                                <span>Feed</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowInventory(false);
                                  handlePlay(pet.id);
                                }}
                                disabled={(pet.energy || 0) <= 0}
                                className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                                title={(pet.energy || 0) <= 0 ? 'No energy' : 'Play'}
                              >
                                <Heart size={14} />
                                <span>Play</span>
                              </button>
                            </div>
                          )}
                          {isMassDeleteMode && isEquipped && (
                            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
                              Unequip before deleting
                            </div>
                          )}
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Food Section */}
            {inventoryTab === 'food' && (
              <>
                {hasFood ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your food inventory ({Object.values(inventory).reduce((sum, qty) => sum + qty, 0)} items)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {FOOD_ITEMS.map((food) => {
                        const qty = inventory[food.id] || 0;
                        if (qty <= 0) return null;
                        return (
                          <div
                            key={food.id}
                            className="card p-4 border-2"
                            style={{
                              borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">{food.icon}</div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{food.name}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{food.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: 'var(--theme-icon-color, rgb(14, 165, 233))' }}>
                                  {qty}x
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center justify-between">
                                <span>Hunger Reduction:</span>
                                <span className="font-medium text-orange-600 dark:text-orange-400">-{food.hungerReduction}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Energy Boost:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">+{food.energyBoost}%</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setInventoryTab('pets');
                              }}
                              className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                              <Bone size={16} />
                              Select Pet to Feed
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bone className="text-gray-400 mx-auto mb-4" size={64} />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Your food inventory is empty
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Buy food from the shop to add items to your inventory
                    </p>
                    <button
                      onClick={() => {
                        setShowInventory(false);
                        sessionStorage.setItem('showFoodTab', 'true');
                        setActiveTab('shop');
                      }}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <ShoppingCart size={18} />
                      Go to Shop
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Feed Modal */}
      {showFeedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bone className="icon-theme" size={22} />
                Feed Pet
              </h3>
              <button
                onClick={() => setShowFeedModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
                style={{ color: 'var(--theme-icon-color, rgb(14, 165, 233))' }}
              >
                <X size={24} />
              </button>
            </div>

            {!hasFood ? (
              <div className="text-center py-8">
                <Bone className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  No food available
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  You need to buy food from the shop to feed your pet.
                </p>
                <button
                  onClick={() => {
                    setShowFeedModal(false);
                    sessionStorage.setItem('showFoodTab', 'true');
                    setActiveTab('shop');
                  }}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <ShoppingCart size={18} />
                  Go to Shop
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Choose food</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FOOD_ITEMS.map((food) => {
                      const qty = inventory[food.id] || 0;
                      if (qty <= 0) return null;
                      const isSelected = selectedFoodId === food.id;
                      return (
                        <button
                          key={food.id}
                          onClick={() => {
                            setSelectedFoodId(food.id);
                            setSelectedQuantity(1);
                          }}
                          className={`text-left border rounded-xl p-3 flex flex-col gap-1 transition-all duration-200 ${
                            isSelected
                              ? 'bg-opacity-10 dark:bg-opacity-20'
                              : 'bg-gray-50 dark:bg-gray-800/60'
                          }`}
                          style={{
                            borderColor: isSelected 
                              ? 'var(--theme-icon-color, rgb(14, 165, 233))' 
                              : 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                            borderWidth: isSelected ? '2px' : '1px',
                            backgroundColor: isSelected 
                              ? 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' 
                              : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{food.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {food.name}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {food.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            <span>Owned: <span className="font-semibold text-gray-800 dark:text-gray-200">{qty}</span></span>
                            <span>
                              -{food.hungerReduction}% Hunger • +{food.energyBoost}% Energy
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedFoodId && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Choose quantity
                      </p>
                      {(() => {
                        const maxQty = inventory[selectedFoodId] || 0;
                        const clampedQuantity = Math.max(1, Math.min(selectedQuantity || 1, maxQty));
                        if (clampedQuantity !== selectedQuantity) {
                          setSelectedQuantity(clampedQuantity);
                        }
                        const food = FOOD_ITEMS.find(f => f.id === selectedFoodId) || FOOD_ITEMS[0];
                        const totalHunger = food.hungerReduction * clampedQuantity;
                        const totalEnergy = food.energyBoost * clampedQuantity;
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max={maxQty}
                                value={clampedQuantity}
                                onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                                className="flex-1"
                                style={{
                                  accentColor: 'var(--theme-icon-color, rgb(14, 165, 233))',
                                }}
                              />
                              <input
                                type="number"
                                min="1"
                                max={maxQty}
                                value={clampedQuantity}
                                onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                                className="input-field w-20 text-center"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Feeding <span className="font-semibold text-gray-800 dark:text-gray-200">{clampedQuantity}</span>{' '}
                              time{clampedQuantity !== 1 ? 's' : ''} will reduce hunger by{' '}
                              <span className="font-semibold text-orange-500">-{totalHunger}%</span> and increase energy by{' '}
                              <span className="font-semibold text-green-500">+{totalEnergy}%</span> (before caps).
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleConfirmFeed}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Bone size={18} />
                        Feed Pet
                      </button>
                      <button
                        onClick={() => setShowFeedModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Delete Settings Modal */}
      {showAutoDeleteSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)' }}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                  <Settings className="icon-theme" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Delete Settings</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose which rarities to auto-delete</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoDeleteSettings(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Selected rarities will be automatically deleted when you spin</li>
                      <li>Equipped pets are never auto-deleted</li>
                      <li>Works with both single spins and 10x spins</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Select Rarities</p>
                  <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                    {autoDeleteRarities.size} selected
                  </span>
                </div>
                <div className="space-y-1.5">
                  {['Common', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Secret'].map((rarity) => {
                    const isSelected = autoDeleteRarities.has(rarity);
                    return (
                      <label
                        key={rarity}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(autoDeleteRarities);
                            if (e.target.checked) {
                              newSet.add(rarity);
                            } else {
                              newSet.delete(rarity);
                            }
                            setAutoDeleteRarities(newSet);
                          }}
                          className="w-4 h-4 text-red-600 rounded focus:ring-1 focus:ring-red-500 focus:ring-offset-1 cursor-pointer accent-red-600 flex-shrink-0"
                        />
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className={`text-xs font-medium ${rarityStyles[rarity] || ''}`}>{rarity}</span>
                          {isSelected && (
                            <Trash2 className="text-red-500 flex-shrink-0" size={14} />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {autoDeleteRarities.size > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      <span className="font-semibold">Warning:</span> Pets of selected rarities will be permanently deleted when spun. This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setAutoDeleteRarities(new Set(['Common']));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowAutoDeleteSettings(false)}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--theme-icon-color, rgb(14, 165, 233))',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Info Modal */}
      {showPetInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)' }}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                  <Info className="icon-theme" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pet Rarity Guide</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All available pets organized by rarity</p>
                </div>
              </div>
              <button
                onClick={() => setShowPetInfo(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {['Secret', 'Mythical', 'Legendary', 'Epic', 'Rare', 'Common'].map((rarity) => {
                const petsInRarity = [
                  // Common pets
                  { name: 'Pixel', species: '🐾', rarity: 'Common', chance: 25 },
                  { name: 'Pebble', species: '🐢', rarity: 'Common', chance: 20 },
                  { name: 'Whiskers', species: '🐱', rarity: 'Common', chance: 15 },
                  { name: 'Bubbles', species: '🐠', rarity: 'Common', chance: 12 },
                  { name: 'Fluffy', species: '🐰', rarity: 'Common', chance: 10 },
                  { name: 'Chirpy', species: '🐦', rarity: 'Common', chance: 8 },
                  // Rare pets
                  { name: 'Blossom', species: '🦊', rarity: 'Rare', chance: 18 },
                  { name: 'Starling', species: '🕊️', rarity: 'Rare', chance: 15 },
                  { name: 'Shadow', species: '🐺', rarity: 'Rare', chance: 12 },
                  { name: 'Coral', species: '🦀', rarity: 'Rare', chance: 10 },
                  { name: 'Frost', species: '🐧', rarity: 'Rare', chance: 8 },
                  // Epic pets
                  { name: 'Nimbus', species: '🦄', rarity: 'Epic', chance: 12 },
                  { name: 'Ember', species: '🐲', rarity: 'Epic', chance: 10 },
                  { name: 'Aurora', species: '🦋', rarity: 'Epic', chance: 8 },
                  { name: 'Thunder', species: '⚡', rarity: 'Epic', chance: 6 },
                  { name: 'Crystal', species: '💎', rarity: 'Epic', chance: 5 },
                  // Legendary pets
                  { name: 'Lumen', species: '🐉', rarity: 'Legendary', chance: 6 },
                  { name: 'Phoenix', species: '🔥', rarity: 'Legendary', chance: 5 },
                  { name: 'Titan', species: '🦁', rarity: 'Legendary', chance: 4 },
                  { name: 'Nova', species: '⭐', rarity: 'Legendary', chance: 3 },
                  // Mythical pets
                  { name: 'Aether', species: '✨', rarity: 'Mythical', chance: 2.5 },
                  { name: 'Void', species: '🌌', rarity: 'Mythical', chance: 2 },
                  { name: 'Cosmos', species: '🌠', rarity: 'Mythical', chance: 1.5 },
                  { name: 'Eternal', species: '💫', rarity: 'Mythical', chance: 1 },
                  // Secret pets
                  { name: 'Eclipse', species: '🌑', rarity: 'Secret', chance: 0.5 },
                  { name: 'Infinity', species: '♾️', rarity: 'Secret', chance: 0.3 },
                  { name: 'Omega', species: 'Ω', rarity: 'Secret', chance: 0.2 },
                ].filter(pet => pet.rarity === rarity);

                if (petsInRarity.length === 0) return null;

                const rarityChance = rarityChances.find(rc => rc.rarity === rarity);
                const totalChance = petsInRarity.reduce((sum, pet) => sum + pet.chance, 0);

                return (
                  <div key={rarity} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${rarityStyles[rarity] || ''}`}>
                        {rarity}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {rarityChance ? `${rarityChance.chance}%` : `${totalChance.toFixed(1)}%`} chance
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {petsInRarity.map((pet) => (
                        <div
                          key={pet.name}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3"
                        >
                          <span className="text-3xl">{pet.species}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{pet.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pet.chance}% drop rate
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowPetInfo(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--theme-icon-color, rgb(14, 165, 233))',
                  color: 'white',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetSanctuary;
