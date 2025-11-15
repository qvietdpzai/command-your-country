import { RegionID } from '../types';
import { PREDEFINED_FLAGS } from './flags';

export interface PredefinedNation {
    name: string;
    emblemImageUrl: string;
    startingTerritory: RegionID;
    nationalContext: string;
}

// This list can be expanded with up to 200 nations as requested.
// For demonstration, a curated list of diverse nations is provided.
export const PREDEFINED_NATIONS: PredefinedNation[] = [
    {
        name: "Liên bang Đại Tây Dương",
        emblemImageUrl: PREDEFINED_FLAGS[0].url,
        startingTerritory: 'western_europe',
        nationalContext: "Một liên minh các quốc gia châu Âu cũ, thống nhất bởi các nguyên tắc dân chủ và thương mại tự do. Liên bang sở hữu một nền kinh tế mạnh mẽ và lực lượng hải quân tiên tiến, nhưng phải đối mặt với sự chia rẽ chính trị nội bộ."
    },
    {
        name: "Đế chế Rồng",
        emblemImageUrl: PREDEFINED_FLAGS[6].url,
        startingTerritory: 'east_asia',
        nationalContext: "Một quốc gia cổ xưa với công nghệ hiện đại, kết hợp truyền thống hàng thiên niên kỷ với tham vọng toàn cầu. Sức mạnh quân sự khổng lồ và tinh thần dân tộc cao độ là đặc trưng của họ."
    },
    {
        name: "Cộng hòa Caspian",
        emblemImageUrl: PREDEFINED_FLAGS[3].url,
        startingTerritory: 'central_asia',
        nationalContext: "Nằm trên ngã tư của các tuyến đường thương mại cổ đại, Cộng hòa Caspian là một cường quốc năng lượng, kiểm soát các nguồn tài nguyên dầu mỏ và khí đốt quan trọng. Họ theo đuổi chính sách ngoại giao thực dụng."
    },
    {
        name: "Liên minh Amazonia",
        emblemImageUrl: PREDEFINED_FLAGS[1].url,
        startingTerritory: 'south_america',
        nationalContext: "Một liên minh các quốc gia Nam Mỹ, tập trung vào việc bảo vệ tài nguyên thiên nhiên và phát triển kinh tế bền vững. Họ có một lực lượng bộ binh thiện chiến trong môi trường rừng rậm."
    },
    {
        name: "Vương quốc Cát",
        emblemImageUrl: PREDEFINED_FLAGS[7].url,
        startingTerritory: 'middle_east',
        nationalContext: "Một quốc gia giàu có nhờ trữ lượng dầu mỏ khổng lồ. Vương quốc này là một thế lực quân sự và kinh tế quan trọng trong khu vực, nhưng phụ thuộc nhiều vào nhập khẩu lương thực và công nghệ."
    },
    {
        name: "Khối Thịnh vượng chung Phương Nam",
        emblemImageUrl: PREDEFINED_FLAGS[2].url,
        startingTerritory: 'oceania',
        nationalContext: "Một quốc gia hải đảo công nghệ cao với lực lượng hải quân và không quân mạnh mẽ. Họ là một trung tâm tài chính và đổi mới toàn cầu, nhưng có nguồn nhân lực hạn chế."
    },
    {
        name: "Liên hiệp Sông Nile",
        emblemImageUrl: PREDEFINED_FLAGS[4].url,
        startingTerritory: 'north_africa',
        nationalContext: "Một quốc gia được hồi sinh, xây dựng trên di sản của các nền văn minh cổ đại. Họ đang nỗ lực hiện đại hóa quân đội và kinh tế, sử dụng vị trí chiến lược của mình để gây ảnh hưởng."
    },
    {
        name: "Đại liên bang Siberia",
        emblemImageUrl: PREDEFINED_FLAGS[5].url,
        startingTerritory: 'eastern_europe',
        nationalContext: "Một quốc gia rộng lớn, giàu tài nguyên nhưng dân cư thưa thớt. Họ sở hữu lực lượng thiết giáp hùng hậu và có khả năng chịu đựng các cuộc chiến tranh kéo dài, nhưng nền kinh tế tương đối yếu."
    },
    {
        name: "Cộng đồng Ấn Độ Dương",
        emblemImageUrl: PREDEFINED_FLAGS[0].url,
        startingTerritory: 'south_asia',
        nationalContext: "Một quốc gia đông dân với tiềm năng kinh tế và quân sự to lớn. Họ đang trên đà trở thành một siêu cường, nhưng phải đối mặt với những thách thức lớn về cơ sở hạ tầng và ổn định xã hội."
    },
    {
        name: "Liên minh Tự do Bắc Mỹ",
        emblemImageUrl: PREDEFINED_FLAGS[1].url,
        startingTerritory: 'north_america',
        nationalContext: "Một cường quốc công nghiệp và công nghệ, với một nền kinh tế năng động và quân đội viễn chinh toàn cầu. Họ đấu tranh để duy trì ảnh hưởng của mình trong một thế giới ngày càng đa cực."
    },
    {
        name: "Cộng hòa Thống nhất châu Phi",
        emblemImageUrl: PREDEFINED_FLAGS[4].url,
        startingTerritory: 'sub_saharan_africa',
        nationalContext: "Một liên minh các quốc gia châu Phi đang phát triển nhanh chóng, giàu tài nguyên khoáng sản. Họ đang xây dựng một lực lượng quân sự chung để bảo vệ lợi ích và chủ quyền của mình trên trường quốc tế."
    },
    {
        name: "Trật tự Hanseatic Mới",
        emblemImageUrl: PREDEFINED_FLAGS[7].url,
        startingTerritory: 'western_europe',
        nationalContext: "Hồi sinh từ liên minh thương mại thời trung cổ, Trật tự Hanseatic là một thế lực kinh tế, tập trung vào thương mại hàng hải và công nghệ tài chính. Họ duy trì một lực lượng hải quân nhỏ nhưng tinh nhuệ để bảo vệ các tuyến đường biển của mình."
    }
];
