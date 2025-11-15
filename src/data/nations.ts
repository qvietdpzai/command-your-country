import { RegionID } from '../types';
import { PREDEFINED_FLAGS } from './flags';

export interface PredefinedNation {
    name: string;
    emblemImageUrl: string;
    startingTerritory: RegionID;
    nationalContext: string;
}

// A curated list of nations ensuring each has a unique, neutral starting territory.
export const PREDEFINED_NATIONS: PredefinedNation[] = [
    {
        name: "Liên bang Đại Tây Dương",
        emblemImageUrl: PREDEFINED_FLAGS[0].url,
        startingTerritory: 'north_america',
        nationalContext: "Một liên minh các quốc gia hùng mạnh, thống nhất bởi các nguyên tắc dân chủ và thương mại tự do. Liên bang sở hữu một nền kinh tế mạnh mẽ và lực lượng hải quân tiên tiến."
    },
    {
        name: "Đế chế Rồng",
        emblemImageUrl: PREDEFINED_FLAGS[6].url,
        startingTerritory: 'southeast_asia',
        nationalContext: "Một quốc gia cổ xưa với công nghệ hiện đại, kết hợp truyền thống hàng thiên niên kỷ với tham vọng toàn cầu. Sức mạnh quân sự khổng lồ và tinh thần dân tộc cao độ là đặc trưng của họ."
    },
    {
        name: "Cộng hòa Caspian",
        emblemImageUrl: PREDEFINED_FLAGS[3].url,
        startingTerritory: 'central_asia',
        nationalContext: "Nằm trên ngã tư của các tuyến đường thương mại cổ đại, Cộng hòa Caspian là một cường quốc năng lượng, kiểm soát các nguồn tài nguyên dầu mỏ và khí đốt quan trọng."
    },
    {
        name: "Liên minh Amazonia",
        emblemImageUrl: PREDEFINED_FLAGS[1].url,
        startingTerritory: 'south_america',
        nationalContext: "Một liên minh các quốc gia Nam Mỹ, tập trung vào việc bảo vệ tài nguyên thiên nhiên và phát triển kinh tế bền vững. Họ có một lực lượng bộ binh thiện chiến."
    },
    {
        name: "Vương quốc Cát",
        emblemImageUrl: PREDEFINED_FLAGS[7].url,
        startingTerritory: 'middle_east',
        nationalContext: "Một quốc gia giàu có nhờ trữ lượng dầu mỏ khổng lồ. Vương quốc này là một thế lực quân sự và kinh tế quan trọng trong khu vực, nhưng phụ thuộc nhiều vào nhập khẩu."
    },
    {
        name: "Khối Thịnh vượng chung Phương Nam",
        emblemImageUrl: PREDEFINED_FLAGS[2].url,
        startingTerritory: 'oceania',
        nationalContext: "Một quốc gia hải đảo công nghệ cao với lực lượng hải quân và không quân mạnh mẽ. Họ là một trung tâm tài chính và đổi mới toàn cầu."
    },
    {
        name: "Liên hiệp Sông Nile",
        emblemImageUrl: PREDEFINED_FLAGS[4].url,
        startingTerritory: 'north_africa',
        nationalContext: "Một quốc gia được hồi sinh, xây dựng trên di sản của các nền văn minh cổ đại. Họ đang nỗ lực hiện đại hóa quân đội và kinh tế, sử dụng vị trí chiến lược của mình."
    },
    {
        name: "Đại liên bang Siberia",
        emblemImageUrl: PREDEFINED_FLAGS[5].url,
        startingTerritory: 'south_asia', // Re-assigned to a neutral territory
        nationalContext: "Một quốc gia rộng lớn, giàu tài nguyên nhưng dân cư thưa thớt. Họ sở hữu lực lượng thiết giáp hùng hậu và có khả năng chịu đựng các cuộc chiến tranh kéo dài."
    },
    {
        name: "Cộng hòa Thống nhất châu Phi",
        emblemImageUrl: PREDEFINED_FLAGS[4].url,
        startingTerritory: 'sub_saharan_africa',
        nationalContext: "Một liên minh các quốc gia châu Phi đang phát triển nhanh chóng, giàu tài nguyên khoáng sản. Họ đang xây dựng một lực lượng quân sự chung để bảo vệ lợi ích của mình."
    }
];
