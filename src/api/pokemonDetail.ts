// src/api/pokemonDetail.ts
import { FlavorTextEntry, PokemonType } from './pokemon.type';
import { Name } from './common.type';

export type PokemonDetail = {
  id: number;
  name: string;
  japaneseName: string;
  image: string;
  types: string[];
  abilities: string[];
  description: string;
  baseStats: { name: string; value: number }[];
};

export const fetchPokemonDetail = async (id: number): Promise<PokemonDetail> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!response.ok) {
    throw new Error('ポケモンの詳細情報の取得に失敗しました');
  }
  const data = await response.json();

  // ポケモン種族情報を取得して日本語名を取得
  const speciesResponse = await fetch(data.species.url);
  if (!speciesResponse.ok) {
    throw new Error('ポケモン種族情報の取得に失敗しました');
  }
  const speciesData = await speciesResponse.json();
  const japaneseNameEntry = speciesData.names.find(
    (nameEntry: Name) => nameEntry.language.name === 'ja'
  );
  const japaneseName = japaneseNameEntry ? japaneseNameEntry.name : data.name;

  // タイプの日本語名を取得
  const types = await Promise.all(
    data.types.map(async (typeInfo: PokemonType) => {
      const typeResponse = await fetch(typeInfo.type.url);
      const typeData = await typeResponse.json();
      const japaneseType = typeData.names.find((name: Name) => name.language.name === 'ja');
      return japaneseType ? japaneseType.name : typeInfo.type.name;
    })
  );

  // 説明文の取得
  const flavorTextEntry = speciesData.flavor_text_entries.find(
    (entry: FlavorTextEntry) => entry.language.name === 'ja'
  );
  const description = flavorTextEntry
    ? flavorTextEntry.flavor_text.replace(/\f/g, ' ')
    : '説明文がありません。';

  return {
    id: data.id,
    name: data.name,
    japaneseName,
    image: data.sprites.front_default,
    types,
    description,
    abilities: data.abilities.map((ability: { ability: Name }) => ability.ability.name),
    baseStats: data.stats.map((stat: { base_stat: number; stat: { name: string } }) => ({
      name: stat.stat.name,
      value: stat.base_stat,
    })),
  };
};