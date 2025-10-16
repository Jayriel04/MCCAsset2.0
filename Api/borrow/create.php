<?php
/**
 * Create Borrow Application API
 * POST /Api/borrow/create.php
 */

// Use an absolute path for reliability
include_once $_SERVER['DOCUMENT_ROOT'] . '/MCCAsset2.0/Api/config/database.php';

// Set header to return JSON
header('Content-Type: application/json');

// Optional: enable detailed errors during dev (remove in production)
// ini_set('display_errors', 1); error_reporting(E_ALL);

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("message" => "Invalid request method."));
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

try {
    $database = new Database();
    $db = $database->getConnection();

    // Make sure data is not empty
    if(
        !empty($data->asset_id) &&
        !empty($data->borrower_name) &&
        !empty($data->borrower_department) &&
        !empty($data->borrower_contact) &&
        !empty($data->borrower_email) &&
        !empty($data->purpose) &&
        !empty($data->requested_date) &&
        !empty($data->expected_return_date)
    ) {
        // --- START: Find asset ID from serial number and check availability ---
        $asset_serial_number = trim($data->asset_id);
        $asset_query = "SELECT id, status FROM assets WHERE serial_number = :serial_number LIMIT 1";
        $asset_stmt = $db->prepare($asset_query);
        $asset_stmt->bindParam(':serial_number', $asset_serial_number);
        $asset_stmt->execute();
        $asset = $asset_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$asset) {
            http_response_code(404);
            echo json_encode(array("message" => "Asset with serial number '{$asset_serial_number}' not found."));
            exit();
        }

        if ($asset['status'] !== 'active') {
            http_response_code(400);
            echo json_encode(array("message" => "Asset is not available for borrowing (status: {$asset['status']})."));
            exit();
        }
        $asset_db_id = (int)$asset['id'];
        // --- END: Asset check ---

        // Sanitize inputs
        $borrower_name = htmlspecialchars(strip_tags($data->borrower_name));
        $borrower_id = isset($data->borrower_id) ? trim(htmlspecialchars(strip_tags($data->borrower_id))) : '';
        $borrower_department = htmlspecialchars(strip_tags($data->borrower_department ?? ''));
        $borrower_contact = htmlspecialchars(strip_tags($data->borrower_contact ?? ''));
        $borrower_email = htmlspecialchars(strip_tags($data->borrower_email ?? ''));
        $purpose = htmlspecialchars(strip_tags($data->purpose));
        $requested_date = $data->requested_date ?? date('Y-m-d');
        $expected_return_date = $data->expected_return_date;
        $notes = htmlspecialchars(strip_tags($data->notes ?? ''));

        // If borrower_id not provided, generate one
        if (empty($borrower_id)) {
            // Example format: BORR-20251016-123 (date + random)
            $borrower_id = 'BORR-' . date('YmdHis') . '-' . mt_rand(100,999);
        }

        // Insert query
        $query = "INSERT INTO borrow_applications
            (asset_id, borrower_name, borrower_id, borrower_department, borrower_contact, borrower_email, purpose, requested_date, expected_return_date, notes, status, created_at)
          VALUES
            (:asset_id, :borrower_name, :borrower_id, :borrower_department, :borrower_contact, :borrower_email, :purpose, :requested_date, :expected_return_date, :notes, :status, :created_at)";
        $stmt = $db->prepare($query);

        // Bind values
        $stmt->bindValue(":asset_id", $asset_db_id, PDO::PARAM_INT);
        $stmt->bindValue(":borrower_name", $borrower_name);
        $stmt->bindValue(":borrower_id", $borrower_id);
        $stmt->bindValue(":borrower_department", $borrower_department);
        $stmt->bindValue(":borrower_contact", $borrower_contact);
        $stmt->bindValue(":borrower_email", $borrower_email);
        $stmt->bindValue(":purpose", $purpose);
        $stmt->bindValue(":requested_date", $requested_date);
        $stmt->bindValue(":expected_return_date", $expected_return_date);
        $stmt->bindValue(":notes", $notes);
        $stmt->bindValue(":status", 'pending'); // adjust as appropriate
        $stmt->bindValue(":created_at", date('Y-m-d H:i:s'));

        if ($stmt->execute()) {
            $newId = $db->lastInsertId();
            http_response_code(201);
            echo json_encode(array(
                "id" => $newId,
                "borrower_id" => $borrower_id,
                "message" => "Borrow application created."
            ));
            exit();
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to create borrow application."));
            exit();
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data. Required fields missing."));
        exit();
    }
} catch (PDOException $exception) {
    http_response_code(503); // Service Unavailable
    echo json_encode(array(
        "error" => $exception->getMessage()
    ));
} catch (Exception $exception) {
    http_response_code(500); // Internal Server Error
    echo json_encode(array(
        "error" => $exception->getMessage()
    ));
}
?>
