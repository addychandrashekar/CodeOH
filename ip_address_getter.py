import socket


def get_local_ip() -> str:
    try:
        # Create a socket connection.
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        # Connect to a remote server. 
        s.connect(("8.8.8.8", 80))

        # Get the local IP address connected to the remote server.
        ip = s.getsockname()[0]

        # Close the socket.
        s.close()

        return ip
    except Exception as e:
        print(f"Error occurred: {e}")
        return None


local_ip = get_local_ip()
print(f"Local IP Address: {local_ip}")
