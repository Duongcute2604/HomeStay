using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeStay.Data.Migrations
{
    /// <inheritdoc />
    public partial class ThemDienTichPhong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Area",
                table: "Rooms",
                type: "decimal(6,2)",
                nullable: false,
                defaultValue: 0m);

            // Phòng đã có từ trước khi thêm cột sẽ mang giá trị 0, mà CHECK
            // yêu cầu > 0 → MySQL 8 từ chối thêm constraint. Gán tạm 35 m²
            // (phòng nhỏ) cho dữ liệu cũ để migration chạy qua, Admin sửa
            // lại diện tích thật ở form quản trị.
            migrationBuilder.Sql("UPDATE `Rooms` SET `Area` = 35 WHERE `Area` <= 0;");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Rooms_Area",
                table: "Rooms",
                sql: "`Area` > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Rooms_Area",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "Area",
                table: "Rooms");
        }
    }
}
